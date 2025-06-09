"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bot, User, Send, X, Maximize, Minimize } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useChatbot } from "./chatbot-provider";
import Cookies from "js-cookie";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [userInitials, setUserInitials] = useState("U");
  const [isTyping, setIsTyping] = useState(false);

  // Function to get user data from cookies
  const getUserDataFromCookies = () => {
    try {
      const userDataCookie = Cookies.get("userData");

      if (userDataCookie) {
        const userData = JSON.parse(userDataCookie);

        if (userData.firstName && userData.lastName) {
          const initials =
            userData.firstName.charAt(0).toUpperCase() +
            userData.lastName.charAt(0).toUpperCase();
          return initials;
        }
      }
    } catch (error) {
      console.log("Could not parse user data from cookies:", error);
    }
    return "U"; // Default fallback
  };

  // Load user initials from cookies
  useEffect(() => {
    const initials = getUserDataFromCookies();
    setUserInitials(initials);
  }, []);

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
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, isLoading]);

  // Auto-focus input when chat opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsTyping(true);
    handleSendMessage(input).finally(() => {
      setIsTyping(false);
    });
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
            flex flex-col overflow-hidden shadow-2xl border-0 backdrop-blur-sm
            ${
              isFullscreen
                ? "w-full h-full rounded-none"
                : "w-96 md:w-[420px] lg:w-[480px] h-[75vh] max-h-[700px] rounded-lg"
            }
          `}
        >
          <div className="bg-gradient-to-r from-primary to-primary/90 text-primary-foreground p-4 flex justify-between items-center border-b border-primary/20">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-foreground/20 rounded-full flex items-center justify-center">
                <Bot size={18} className="text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Scanalyze Assistant</h3>
                <p className="text-xs text-primary-foreground/80">
                  {isLoading || isTyping ? "Thinking..." : "Online"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleChat}
                className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20 transition-colors"
              >
                <X size={16} />
              </Button>
            </div>
          </div>
          <div
            ref={scrollAreaRef}
            className="flex-1 p-4 overflow-y-auto bg-gradient-to-b from-background/50 to-background"
          >
            <div className="space-y-6">
              {messages.map((message, index) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-2 animate-in slide-in-from-bottom-2 fade-in-0 duration-500 ${
                    message.isUser ? "justify-end" : "justify-start"
                  }`}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {!message.isUser && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mt-1 shadow-sm border border-primary/20">
                      <Bot size={16} className="text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[65%] rounded-2xl p-3 shadow-sm border transition-all duration-200 hover:shadow-md ${
                      message.isUser
                        ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground border-primary/20 rounded-br-md"
                        : "bg-card border-border rounded-bl-md"
                    }`}
                  >
                    <div
                      className="text-sm leading-relaxed space-y-2"
                      dangerouslySetInnerHTML={{
                        __html: formatText(message.text),
                      }}
                    />
                  </div>
                  {message.isUser && (
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center mt-1 shadow-sm border border-primary/20">
                      <span className="text-xs font-bold text-primary-foreground">
                        {userInitials}
                      </span>
                    </div>
                  )}
                </div>
              ))}
              {(isLoading || isTyping) && (
                <div className="flex items-start gap-2 justify-start animate-in slide-in-from-bottom-2 fade-in-0">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mt-1 shadow-sm border border-primary/20">
                    <Bot size={16} className="text-primary animate-pulse" />
                  </div>
                  <div className="max-w-[65%] rounded-2xl rounded-bl-md p-3 bg-card border border-border shadow-sm">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1">
                        <div
                          className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-primary/60 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        ></div>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Thinking...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <form
            onSubmit={handleSubmit}
            className="p-3 border-t border-border/50 bg-background/80 backdrop-blur-sm"
          >
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about your health..."
                  className="min-h-10 resize-none pr-12 border-2 border-border/50 focus:border-primary/50 rounded-xl transition-all duration-200 bg-background/50"
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                />
                <div className="absolute right-3 bottom-2 text-xs text-muted-foreground">
                  {input.length > 0 && (
                    <span className="animate-in fade-in-0 duration-200">
                      {input.length}/500
                    </span>
                  )}
                </div>
              </div>
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || isTyping || !input.trim()}
                className="h-10 w-10 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 disabled:scale-100"
              >
                {isLoading || isTyping ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground/20 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </Button>
            </div>
            <div className="mt-2 text-xs text-orange-600 dark:text-orange-400 text-center bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800/30 rounded-md px-2 py-1">
              ⚠️ Always consult your doctor. AI can make mistakes.
            </div>
          </form>
        </Card>
      ) : (
        <Button
          onClick={toggleChat}
          className="h-14 w-14 p-0 rounded-full shadow-2xl hover:shadow-3xl bg-gradient-to-br from-primary to-primary/80 hover:from-primary/90 hover:to-primary border-0 transition-all duration-300 hover:scale-110 animate-in slide-in-from-bottom-5 fade-in-0 flex items-center justify-center"
        >
          <Bot
            className="text-primary-foreground"
            style={{ width: "30px", height: "30px" }}
          />
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background animate-pulse"></div>
        </Button>
      )}
    </div>
  );
}
