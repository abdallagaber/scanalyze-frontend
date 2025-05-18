"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageCircle, Send, X, Maximize, Minimize } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useChatbot } from "./chatbot-provider";

export function Chatbot() {
  const {
    isOpen,
    setIsOpen,
    messages,
    input,
    setInput,
    isLoading,
    isFullscreen,
    setIsFullscreen,
    handleSendMessage,
  } = useChatbot();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");

  // Set fullscreen by default on mobile
  useEffect(() => {
    if (isMobile) {
      setIsFullscreen(true);
    }
  }, [isMobile, setIsFullscreen]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current;
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages, isLoading]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  // Function to format text with markdown-style formatting
  const formatText = (text: string) => {
    // Parse **text** or *text* for bold
    const boldText = text.replace(
      /\*\*(.*?)\*\*|\*(.*?)\*/g,
      "<strong>$1$2</strong>"
    );

    // Parse bullet points (* at the beginning of a line)
    const withBullets = boldText
      .replace(/^\s*\*\s+(.*?)$/gm, "<li>$1</li>")
      .replace(/(<li>.*?<\/li>(\s*<li>.*?<\/li>)*)/g, "<ul>$1</ul>");

    // Parse headings (# at the beginning of a line)
    const withHeadings = withBullets.replace(/^#\s+(.*?)$/gm, "<h3>$1</h3>");

    // Replace line breaks with <br>
    const withLineBreaks = withHeadings.replace(/\n/g, "<br>");

    return withLineBreaks;
  };

  return (
    <div
      className={`${
        isOpen && isFullscreen
          ? "fixed inset-0 z-50"
          : "fixed bottom-4 right-4 z-50"
      }`}
    >
      {isOpen ? (
        <Card
          className={`
            flex flex-col overflow-hidden shadow-lg
            ${
              isFullscreen
                ? "w-full h-full rounded-none"
                : "w-80 md:w-96 h-[70vh] max-h-[600px]"
            }
          `}
        >
          <div className="bg-primary text-primary-foreground p-3 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <MessageCircle size={20} />
              <h3 className="font-medium">Scanalyze Assistant</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
              >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
              >
                <X size={18} />
              </Button>
            </div>
          </div>
          <div ref={scrollAreaRef} className="flex-1 p-3 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.isUser
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <div
                      className="text-sm space-y-1"
                      dangerouslySetInnerHTML={{
                        __html: formatText(message.text),
                      }}
                    />
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <form onSubmit={handleSubmit} className="p-3 border-t">
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your question..."
                className="min-h-10 resize-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
              >
                <Send size={18} />
              </Button>
            </div>
          </form>
        </Card>
      ) : (
        <Button
          onClick={toggleChat}
          size="icon"
          className="h-12 w-12 rounded-full shadow-lg"
        >
          <MessageCircle size={24} />
        </Button>
      )}
    </div>
  );
}
