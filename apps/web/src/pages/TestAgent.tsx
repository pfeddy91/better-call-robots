import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Phone, PhoneOff, Copy, MoreHorizontal } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface Message {
  id: string;
  type: "assistant" | "user";
  content: string;
  timestamp: string;
}

interface CallData {
  id: string;
  status: "in_progress" | "ended" | "connecting";
  duration: string;
  from: string;
  to: string;
  objective: string;
  startedAt: string;
}

const TestAgent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [callData, setCallData] = useState<CallData>({
    id: "f984fdd4-3e0e-4c9b-a81e-db27fd47324f",
    status: "in_progress",
    duration: "0:18",
    from: "+441566700605",
    to: "+447733952491",
    objective: "Please help me sign up for your service",
    startedAt: "6:00:52 pm"
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "assistant",
      content: "Hi Paolo! How's it going?",
      timestamp: "18:00:52"
    },
    {
      id: "2",
      type: "user",
      content: "Good. How are you?",
      timestamp: "18:00:55"
    },
    {
      id: "3",
      type: "assistant",
      content: "Great thanks for asking. So I hear you're interested in our luxury travel packages to Southern Italy?",
      timestamp: "18:01:02"
    },
    {
      id: "4",
      type: "user",
      content: "Yeah. That's right.",
      timestamp: "18:01:06"
    }
  ]);

  const [isCallActive, setIsCallActive] = useState(true);

  // Simulate live conversation updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (isCallActive && messages.length < 10) {
        const newMessages = [
          { type: "assistant" as const, content: "Perfect! We have some amazing packages available. What time of year were you thinking of traveling?" },
          { type: "user" as const, content: "I was thinking maybe late spring, around May?" },
          { type: "assistant" as const, content: "May is absolutely beautiful in Southern Italy! The weather is perfect and the crowds are still manageable." },
          { type: "user" as const, content: "That sounds perfect. What kind of activities do your packages include?" },
          { type: "assistant" as const, content: "Our packages include guided tours of historic sites, wine tastings, cooking classes, and private beach access." },
          { type: "user" as const, content: "Wow, that sounds comprehensive. What about accommodation?" }
        ];

        const nextMessageIndex = messages.length - 4;
        if (nextMessageIndex < newMessages.length) {
          const newMessage = newMessages[nextMessageIndex];
          const now = new Date();
          const timestamp = `${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}:${(now.getSeconds() + nextMessageIndex).toString().padStart(2, '0')}`;
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: newMessage.type,
            content: newMessage.content,
            timestamp
          }]);

          // Update call duration
          const startTime = new Date();
          startTime.setHours(18, 0, 52);
          const currentTime = new Date();
          const duration = Math.floor((currentTime.getTime() - startTime.getTime()) / 1000) + nextMessageIndex * 5;
          const minutes = Math.floor(duration / 60);
          const seconds = duration % 60;
          setCallData(prev => ({ ...prev, duration: `${minutes}:${seconds.toString().padStart(2, '0')}` }));
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isCallActive, messages.length]);

  const handleEndCall = () => {
    setIsCallActive(false);
    setCallData(prev => ({ ...prev, status: "ended" }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "in_progress": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "ended": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "connecting": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-display font-bold text-foreground">Live Call</h1>
            <p className="text-body text-muted-foreground">Agent testing in progress</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Copy className="w-4 h-4 mr-2" />
            Copy Link
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={handleEndCall}
            disabled={!isCallActive}
          >
            <PhoneOff className="w-4 h-4 mr-2" />
            End Call
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Left Panel - Call Data */}
        <div className="w-1/2 p-6 border-r border-border bg-card/50">
          <div className="space-y-6">
            {/* Call Status Card */}
            <Card className="bg-card border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-h3 text-foreground">Call Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-body text-muted-foreground">ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm font-mono text-foreground">{callData.id}</span>
                    <Button variant="ghost" size="icon" className="h-4 w-4">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-body text-muted-foreground">Status</span>
                  <Badge className={getStatusColor(callData.status)}>
                    {callData.status.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-body text-muted-foreground">Duration</span>
                  <span className="text-body text-foreground font-mono">{callData.duration}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-body text-muted-foreground">From</span>
                  <span className="text-body text-foreground">{callData.from}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-body text-muted-foreground">To</span>
                  <span className="text-body text-foreground">{callData.to}</span>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-body text-muted-foreground">Objective</span>
                  <span className="text-body text-foreground text-right max-w-48">{callData.objective}</span>
                </div>
              </CardContent>
            </Card>

            {/* Actions Card */}
            <Card className="bg-card border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-h3 text-foreground">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full justify-start text-left">
                  View Full Transcript
                </Button>
                <Button variant="outline" className="w-full justify-start text-left">
                  Transfer Live Call
                </Button>
                <Button variant="outline" className="w-full justify-start text-left">
                  <MoreHorizontal className="w-4 h-4 mr-2" />
                  More Options
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Panel - Live Transcript */}
        <div className="w-1/2 flex flex-col">
          {/* Transcript Header */}
          <div className="p-4 border-b border-border bg-card/50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-h3 text-foreground">Live Transcript</h2>
                <p className="text-body-sm text-muted-foreground">
                  Call ID: {callData.id} • Started At: {callData.startedAt}
                </p>
              </div>
              {isCallActive && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-body-sm text-green-500 font-medium">Call Active</span>
                </div>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] space-y-1 ${message.type === 'user' ? 'order-1' : ''}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-body-sm font-medium ${
                      message.type === 'assistant' 
                        ? 'text-blue-500' 
                        : 'text-purple-500'
                    }`}>
                      {message.type === 'assistant' ? 'Assistant' : 'User'}
                    </span>
                    <span className="text-caption text-muted-foreground">{message.timestamp}</span>
                  </div>
                  <div className={`p-3 rounded-lg ${
                    message.type === 'assistant'
                      ? 'bg-blue-500/10 text-foreground border border-blue-500/20'
                      : 'bg-purple-500/10 text-foreground border border-purple-500/20'
                  }`}>
                    <p className="text-body">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {isCallActive && (
              <div className="flex gap-3 justify-start">
                <div className="max-w-[70%] space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm font-medium text-blue-500">Assistant</span>
                    <span className="text-caption text-muted-foreground">typing...</span>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-blue-500/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-blue-500/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-blue-500/60 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAgent;