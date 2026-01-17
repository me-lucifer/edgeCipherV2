
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageSquare, Bookmark, Crown, BookOpen, Video, AlertTriangle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";


interface CommunityModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

type Post = {
    id: string;
    author: {
        name: string;
        avatar: string;
        persona: string;
    };
    timestamp: string;
    content: string;
    trade?: {
        instrument: string;
        result: number;
    };
    likes: number;
    comments: { author: string; text: string }[];
};

const mockPosts: Post[] = [
    {
        id: '1',
        author: { name: "Alex R.", avatar: "/avatars/01.png", persona: "Disciplined Scalper" },
        timestamp: "2 hours ago",
        content: "What I saw: My ETH short setup was showing signs of invalidation in a choppy market.\nWhat I did: Instead of hoping, I followed my rules and cut the trade for a small loss.\nWhat I learned: A controlled loss is a win for discipline. The old me would have held and lost more.",
        trade: { instrument: "ETH-PERP", result: -1.0 },
        likes: 15,
        comments: [{ author: "Jane D.", text: "That's the way! A red day sticking to the plan is better than a green day breaking rules." }],
    },
    {
        id: '2',
        author: { name: "Maria S.", avatar: "/avatars/02.png", persona: "Patient Swing Trader" },
        timestamp: "8 hours ago",
        content: "What I saw: My A+ setup on BTC printed after two days of patient waiting.\nWhat I did: I executed the plan, set my SL and TP, and let the trade run without interference.\nWhat I learned: Trusting my analysis prevents me from second-guessing good trades. Journaling builds that trust.",
        trade: { instrument: "BTC-PERP", result: 3.2 },
        likes: 42,
        comments: [],
    },
    {
        id: '3',
        author: { name: "Chen W.", avatar: "/avatars/03.png", persona: "Data-Driven Analyst" },
        timestamp: "1 day ago",
        content: "Insight from my journal review: my win rate is 15% higher during the NY session. I'm going to stop trading the London session entirely for two weeks and see how it impacts my P&L.",
        likes: 28,
        comments: [{ author: "Alex R.", text: "Great insight. Session-based performance is so underrated." }],
    },
];

const leaders = [
    { name: "Jane D.", knownFor: "Risk Discipline", avatar: "/avatars/04.png" },
    { name: "Sam K.", knownFor: "Journaling Consistency", avatar: "/avatars/05.png" },
    { name: "Eva L.", knownFor: "Psychology Tips", avatar: "/avatars/01.png" },
];

const learningResources = [
    { title: "The Art of the Stop Loss", type: "Article", icon: BookOpen },
    { title: "Trading Psychology: Handling Drawdowns", type: "Video", icon: Video },
    { title: "A Guide to Effective Journaling", type: "Article", icon: BookOpen },
    { title: "Understanding Market Volatility (VIX)", type: "Video", icon: Video },
]

function PostCard({ post, onLike }: { post: Post, onLike: (id: string) => void }) {
    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                    <Avatar>
                        <AvatarImage src={post.author.avatar} alt={post.author.name} />
                        <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold text-foreground">{post.author.name}</p>
                        <p className="text-xs text-muted-foreground">{post.author.persona} &bull; {post.timestamp}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
                {post.trade && (
                    <div className="p-3 rounded-md bg-muted/50 border border-border/50 flex items-center justify-between text-sm">
                        <span className="font-mono text-foreground">{post.trade.instrument}</span>
                        <span className={cn("font-semibold font-mono", post.trade.result > 0 ? "text-green-400" : "text-red-400")}>
                            {post.trade.result > 0 ? '+' : ''}{post.trade.result.toFixed(2)}R
                        </span>
                    </div>
                )}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50 text-muted-foreground">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => onLike(post.id)}>
                        <ThumbsUp className="h-4 w-4" /> {post.likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2" disabled>
                        <MessageSquare className="h-4 w-4" /> {post.comments.length}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 ml-auto">
                        <Bookmark className="h-4 w-4" /> Save
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function FeedTab() {
    const [posts, setPosts] = useState<Post[]>(mockPosts);
    const [newPostContent, setNewPostContent] = useState("");

    const officialPosts = [
        {
            title: "The Art of the Stop Loss",
            bullets: ["Why your SL is your best friend.", "How to set it based on volatility, not hope."],
            tag: "Education",
            icon: BookOpen,
        },
        {
            title: "Market Warning: High VIX",
            bullets: ["Crypto VIX is in the 'Elevated' zone.", "Consider reducing size and avoiding low-conviction trades."],
            tag: "Market Warning",
            icon: AlertTriangle,
        },
        {
            title: "New Feature: Discipline Guardrails",
            bullets: ["Get real-time warnings in your Trade Planning module.", "Enable them in Performance Analytics."],
            tag: "Feature Update",
            icon: Zap,
        },
        {
            title: "Video: How to Journal a Losing Trade",
            bullets: ["Turn your losses into your biggest lessons.", "A step-by-step guide to effective reflection."],
            tag: "New Video",
            icon: Video,
        }
    ];

    const handleLike = (id: string) => {
        setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    };

    const handleCreatePost = () => {
        if (!newPostContent.trim()) return;
        const newPost: Post = {
            id: String(Date.now()),
            author: { name: "You", avatar: "/avatars/user.png", persona: "The Determined Trader" },
            timestamp: "Just now",
            content: newPostContent,
            likes: 0,
            comments: [],
        };
        setPosts([newPost, ...posts]);
        setNewPostContent("");
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <Card className="bg-muted/30 border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    EdgeCipher
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">Official</Badge>
                </CardTitle>
                <CardDescription>Key updates and educational content from the team.</CardDescription>
              </CardHeader>
              <CardContent>
                <Carousel opts={{ align: "start" }} className="w-full">
                  <CarouselContent className="-ml-4">
                    {officialPosts.map((post, index) => (
                      <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                        <div className="p-1 h-full">
                            <Card className="bg-muted/50 border-primary/20 h-full">
                                <CardContent className="p-4 flex flex-col items-start gap-4 h-full">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <post.icon className="h-4 w-4 text-primary" />
                                            <p className="font-semibold text-foreground text-sm">{post.title}</p>
                                        </div>
                                        <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                            {post.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
                                        </ul>
                                    </div>
                                    <Badge variant="secondary" className="bg-primary/10 text-primary">{post.tag}</Badge>
                                </CardContent>
                            </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="ml-12" />
                  <CarouselNext className="mr-12" />
                </Carousel>
              </CardContent>
            </Card>

            <div className="space-y-6">
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Share an insight</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Textarea 
                                placeholder="What did you learn today? Share a trade breakdown, a psychological insight, or a question for the community."
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <Button onClick={handleCreatePost}>Post (Prototype)</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {posts.map(post => (
                    <PostCard key={post.id} post={post} onLike={handleLike} />
                ))}
            </div>
        </div>
    );
}

function LearnTab() {
    return (
         <div className="max-w-3xl mx-auto space-y-6">
             <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle>Learning Resources</CardTitle>
                    <CardDescription>Curated content to sharpen your trading skills. (Phase 2)</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    {learningResources.map((resource, i) => (
                         <Card key={i} className="bg-muted/50 hover:bg-muted cursor-pointer transition-colors">
                            <CardContent className="p-4 flex items-center gap-4">
                                <resource.icon className="h-6 w-6 text-primary flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-foreground">{resource.title}</p>
                                    <p className="text-xs text-muted-foreground">{resource.type}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

function LeadersTab() {
    return (
        <div className="max-w-3xl mx-auto">
             <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /> Community Leaders</CardTitle>
                    <CardDescription>Recognized members known for their helpful insights and discipline.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leaders.map(leader => (
                        <Card key={leader.name} className="bg-muted/50">
                             <CardContent className="p-4 flex items-center gap-4">
                                <Avatar>
                                    <AvatarImage src={leader.avatar} alt={leader.name} />
                                    <AvatarFallback>{leader.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold text-foreground">{leader.name}</p>
                                    <p className="text-xs text-muted-foreground">Known for: {leader.knownFor}</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

export function CommunityModule({ onSetModule }: CommunityModuleProps) {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Community — Discipline & Learning</h1>
                <p className="text-muted-foreground">High-signal reflections, charts, and insights. No signals. No hype.</p>
            </div>
            
            <Tabs defaultValue="feed" className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
                    <TabsTrigger value="feed">Feed</TabsTrigger>
                    <TabsTrigger value="learn">Learn</TabsTrigger>
                    <TabsTrigger value="leaders">Leaders</TabsTrigger>
                </TabsList>
                <TabsContent value="feed" className="mt-8">
                    <FeedTab />
                </TabsContent>
                <TabsContent value="learn" className="mt-8">
                    <LearnTab />
                </TabsContent>
                <TabsContent value="leaders" className="mt-8">
                    <LeadersTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
