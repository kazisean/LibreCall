import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { db } from '@/lib/firebase';
import { collection, doc, addDoc, getDoc, updateDoc, onSnapshot, setDoc } from 'firebase/firestore';

const servers = {
  iceServers: [
    {
      urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
    },
  ],
  iceCandidatePoolSize: 10,
};

export function VideoCall() {
  const navigate = useNavigate();
  const params = useParams();
  
  const [callId, setCallId] = useState<string | undefined>(params.callId);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isCallSetupComplete, setIsCallSetupComplete] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  
  // Set video srcObject when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);
  
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);
  
  // Initialize WebRTC on component mount
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      console.log("Initializing WebRTC");
      
      try {
        // Create a new RTCPeerConnection here instead of at component initialization
        const peerConnection = new RTCPeerConnection(servers);
        pcRef.current = peerConnection;
        
        // Setup media sources
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        
        if (!isMounted) return; // Safety check if component unmounted
        
        const remote = new MediaStream();
        
        setLocalStream(stream);
        setRemoteStream(remote);
        
        // Push tracks from local stream to peer connection
        stream.getTracks().forEach(track => {
          if (peerConnection.signalingState !== 'closed') {
            peerConnection.addTrack(track, stream);
          } else {
            console.warn('Cannot add track - peer connection is closed');
          }
        });
        
        // Pull tracks from remote stream, add to video stream
        peerConnection.ontrack = event => {
          event.streams[0].getTracks().forEach(track => {
            remote.addTrack(track);
          });
        };
        
        // Set video elements
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remote;
        }
        
        if (params.callId) {
          console.log("Joining existing call with ID:", params.callId);
          await joinCall(peerConnection, params.callId);
        } else {
          console.log("Creating new call");
          await createCall(peerConnection);
        }
        
        if (isMounted) {
          setIsCallSetupComplete(true);
        }
      } catch (err) {
        console.error("Error initializing WebRTC:", err);
        if (isMounted) {
          setIsCallSetupComplete(true); // Even on error, mark setup as complete
        }
      }
    };
    
    init();
    
    // Cleanup function
    return () => {
      isMounted = false;
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
    };
  }, []);
  
  const copyToClipboard = () => {
    if (callId) {
      navigator.clipboard.writeText(callId);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };
  
  const createCall = async (peerConnection: RTCPeerConnection) => {
    // Create a call document in Firestore
    const callDocRef = doc(collection(db, 'calls'));
    const newCallId = callDocRef.id;
    console.log("Creating call with ID:", newCallId);
    
    // Set the call ID state
    setCallId(newCallId);
    
    const offerCandidates = collection(callDocRef, 'offerCandidates');
    const answerCandidates = collection(callDocRef, 'answerCandidates');
    
    // Update URL with call ID
    navigate(`/call/${newCallId}`, { replace: true });
    
    // Get candidates for caller, save to db
    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        addDoc(offerCandidates, event.candidate.toJSON());
      }
    };
    
    // Create offer
    const offerDescription = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offerDescription);
    
    const offer = {
      sdp: offerDescription.sdp,
      type: offerDescription.type,
    };
    
    await setDoc(callDocRef, { offer });
    
    // Listen for remote answer
    onSnapshot(callDocRef, snapshot => {
      const data = snapshot.data();
      if (peerConnection.signalingState !== 'closed' && 
          !peerConnection.currentRemoteDescription && 
          data?.answer) {
        const answerDescription = new RTCSessionDescription(data.answer);
        peerConnection.setRemoteDescription(answerDescription);
      }
    });
    
    // Listen for remote ICE candidates
    onSnapshot(answerCandidates, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' && peerConnection.signalingState !== 'closed') {
          const candidate = new RTCIceCandidate(change.doc.data());
          peerConnection.addIceCandidate(candidate);
        }
      });
    });
  };
  
  const joinCall = async (peerConnection: RTCPeerConnection, id: string) => {
    const callDocRef = doc(db, 'calls', id);
    const callSnapshot = await getDoc(callDocRef);
    
    if (!callSnapshot.exists()) {
      console.error("Call not found");
      alert("Call not found");
      navigate('/');
      return;
    }
    
    const answerCandidates = collection(callDocRef, 'answerCandidates');
    const offerCandidates = collection(callDocRef, 'offerCandidates');
    
    peerConnection.onicecandidate = event => {
      if (event.candidate) {
        addDoc(answerCandidates, event.candidate.toJSON());
      }
    };
    
    const callData = callSnapshot.data();
    if (!callData || !callData.offer) {
      console.error("Invalid call data - no offer found");
      alert("This call is invalid or has ended");
      navigate('/');
      return;
    }
    
    const offerDescription = callData.offer;
    await peerConnection.setRemoteDescription(new RTCSessionDescription(offerDescription));
    
    const answerDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answerDescription);
    
    const answer = {
      type: answerDescription.type,
      sdp: answerDescription.sdp,
    };
    
    await updateDoc(callDocRef, { answer });
    
    onSnapshot(offerCandidates, snapshot => {
      snapshot.docChanges().forEach(change => {
        if (change.type === 'added' && peerConnection.signalingState !== 'closed') {
          const data = change.doc.data();
          peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      });
    });
  };
  
  const hangUp = async () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    
    if (callId) {
      try {
        const callDocRef = doc(db, 'calls', callId);
        await updateDoc(callDocRef, {
          status: 'ended',
          endedAt: new Date()
        });
      } catch (err) {
        console.warn("Could not update call status:", err);
      }
    }
    
    navigate('/');
  };
  
  return (
    <div className="min-h-screen bg-black flex flex-col p-4">
      <div className="text-white text-center mb-4 p-3 bg-zinc-900 rounded-lg">
        <h1 className="text-2xl font-bold mb-2">Libre Call</h1>
        
        {isCallSetupComplete ? (
          callId ? (
            <div className="inline-block">
              <p className="text-sm font-medium mb-1">Share this call ID with others to join:</p>
              <div className="flex items-center justify-center gap-2 bg-zinc-800 p-2 rounded">
                <code className="text-sm text-white font-mono">{callId}</code>
                <div className="relative">
                  <Button
                    variant="outline" 
                    size="sm"
                    onClick={copyToClipboard}
                    className="h-8 w-8 p-0 text-white"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                      <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                      <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                    </svg>
                  </Button>
                  {copyFeedback && (
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                      Copied!
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-zinc-400">Call setup failed. Please try again.</p>
          )
        ) : (
          <p className="text-zinc-400">Setting up your call...</p>
        )}
      </div>
      
      <div className="flex-1 flex flex-col md:flex-row gap-4 max-h-[calc(100vh-220px)]">
        <div className="w-full md:w-1/2 bg-zinc-900 rounded-lg overflow-hidden relative">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover"
          ></video>
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 text-xs rounded">
            You
          </div>
        </div>
        
        <div className="w-full md:w-1/2 bg-zinc-900 rounded-lg overflow-hidden relative">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          ></video>
          <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 text-xs rounded">
            Remote
          </div>
        </div>
      </div>
      
      <div className="mt-4 flex justify-center">
        <Button 
          onClick={hangUp} 
          className="bg-red-900 hover:bg-red-800 text-white w-40"
        >
          End Call
        </Button>
      </div>
    </div>
  );
}