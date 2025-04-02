import { useState } from "react";
import Layout from "@/components/layout/Layout";
import ChatWindow from "@/components/chat/ChatWindow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import GameWinNotifications from "@/components/global/GameWinNotifications";

export default function ChatPage() {
  const [activeTab, setActiveTab] = useState("global");

  return (
    <Layout title="Chat">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Live Chat</h1>
        <p className="text-gray-400">Chat with other players in real-time</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Chat settings and information */}
        <div className="md:col-span-1">
          <Card className="bg-darkblue mb-6">
            <CardHeader>
              <CardTitle className="text-white text-lg">Chat Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Chat Status</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-success rounded-full pulse-animation"></div>
                    <span className="text-sm text-gray-300">Online</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-white mb-2">Chat Rules</h3>
                  <ul className="text-sm text-gray-300 space-y-2">
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-success mr-2 mt-1"></i>
                      <span>Be respectful to other users</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-success mr-2 mt-1"></i>
                      <span>No spamming or excessive messages</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-success mr-2 mt-1"></i>
                      <span>No sharing of personal information</span>
                    </li>
                    <li className="flex items-start">
                      <i className="fas fa-check-circle text-success mr-2 mt-1"></i>
                      <span>No promotional content without permission</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-darkblue mb-6">
            <CardHeader>
              <CardTitle className="text-white text-lg">Online Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Simulated online users - in a real app these would come from WebSocket */}
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-primary text-xs font-bold">RM</span>
                  </div>
                  <div>
                    <p className="text-white text-sm">Rahul M.</p>
                    <p className="text-xs text-gray-400">Playing Color Prediction</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
                    <span className="text-secondary text-xs font-bold">AK</span>
                  </div>
                  <div>
                    <p className="text-white text-sm">Ankit K.</p>
                    <p className="text-xs text-gray-400">Online</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                    <span className="text-accent text-xs font-bold">PJ</span>
                  </div>
                  <div>
                    <p className="text-white text-sm">Priya J.</p>
                    <p className="text-xs text-gray-400">Playing Lucky Dice</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center">
                    <span className="text-success text-xs font-bold">VS</span>
                  </div>
                  <div>
                    <p className="text-white text-sm">Vijay S.</p>
                    <p className="text-xs text-gray-400">Online</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Game Wins Section */}
          <Card className="bg-darkblue">
            <CardHeader>
              <CardTitle className="text-white text-lg">Recent Wins</CardTitle>
            </CardHeader>
            <CardContent>
              <GameWinNotifications compact={true} />
            </CardContent>
          </Card>
        </div>

        {/* Chat window */}
        <div className="md:col-span-3">
          <Tabs defaultValue="global" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-md grid-cols-2 mb-4">
              <TabsTrigger value="global">Global Chat</TabsTrigger>
              <TabsTrigger value="game">Game Chat</TabsTrigger>
            </TabsList>
            
            <TabsContent value="global" className="h-[calc(100vh-250px)]">
              <ChatWindow />
            </TabsContent>
            
            <TabsContent value="game" className="h-[calc(100vh-250px)]">
              <Card className="bg-darkblue h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="text-white">Game Chat</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-neutral/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-gamepad text-gray-400 text-2xl"></i>
                    </div>
                    <h3 className="text-white text-lg font-semibold mb-2">No Active Game</h3>
                    <p className="text-gray-400">
                      Join a game session to chat with other players in that game
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
