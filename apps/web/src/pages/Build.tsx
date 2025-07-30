import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, MoreHorizontal } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Build = () => {
  const navigate = useNavigate();
  
  // Get agents from localStorage
  const getStoredAgents = () => {
    const stored = localStorage.getItem('agents');
    return stored ? JSON.parse(stored) : [];
  };

  const [agents, setAgents] = useState(getStoredAgents);

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-display font-bold text-foreground mb-2">Agents</h1>
            <p className="text-body text-muted-foreground">Create and manage your AI agents</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="text-foreground">
              Playground
            </Button>
            <Button 
              className="bg-foreground text-background hover:bg-foreground/90"
              onClick={() => navigate("/build/new")}
            >
              <Plus className="w-4 h-4 mr-2" />
              New agent
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search agents..." 
            className="pl-10 max-w-md"
          />
        </div>

        {/* Agents Table */}
        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                <TableHead className="text-muted-foreground font-medium">Created by</TableHead>
                <TableHead className="text-muted-foreground font-medium">Created at</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agents.map((agent) => (
                <TableRow 
                  key={agent.id} 
                  className="hover:bg-muted/50 cursor-pointer"
                  onClick={() => navigate("/build/finalized", { 
                    state: { agentData: agent }
                  })}
                >
                  <TableCell className="font-medium text-foreground">{agent.name}</TableCell>
                  <TableCell className="text-muted-foreground">{agent.createdBy}</TableCell>
                  <TableCell className="text-muted-foreground">{agent.createdAt}</TableCell>
                  <TableCell>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-foreground"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default Build;