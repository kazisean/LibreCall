import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function HomePage() {
  const [callerId, setCallerId] = useState<string>("");
  const navigate = useNavigate();

  const handleCreateCall = () => {
    // Navigate to video call page without a call ID
    // The VideoCall component will create a new call
    navigate('/call');
  };

  const handleJoinCall = () => {
    // Navigate to video call page with the specified call ID
    if (callerId) {
      navigate(`/call/${callerId}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <Card className="w-full max-w-md bg-zinc-900 border-zinc-800 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-white">
            Libre Call
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Connect with anyone, anywhere
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="callerId" className="text-sm font-medium text-zinc-300">
              Caller ID
            </label>
            <Input
              id="callerId"
              placeholder="Enter caller ID to join"
              value={callerId}
              onChange={(e) => setCallerId(e.target.value)}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handleCreateCall} 
              className="bg-white text-black hover:bg-zinc-200"
            >
              Create Call
            </Button>
            <Button 
              onClick={handleJoinCall} 
              className="bg-zinc-800 hover:bg-zinc-700 text-white border border-white"
              disabled={!callerId}
            >
              Join Call
            </Button>
          </div>
        </CardContent>
        
        <Separator className="bg-zinc-800" />
        
        <CardFooter className="pt-4">
          <p className="text-zinc-500 text-xs text-center w-full">
            Creating a call will generate a unique ID you can share with others
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}