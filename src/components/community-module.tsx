
"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThumbsUp, MessageSquare, Bookmark, Crown, Send } from "lucide-react";
import { cn } from "@/lib/utils";

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
        content: "Tough day. Followed my rules and cut a loser short on ETH. The old me would've held on hoping for a reversal. Small loss, but a big win for discipline.",
        trade: { instrument: "ETH-PERP", result: -1.0 },
        likes: 15,
        comments: [{ author: "Jane D.", text: "That's the way! A red day sticking to the plan is better than a green day breaking rules." }],
    },
    {
        id: '2',
        author: { name: "Maria S.", avatar: "/avatars/02.png", persona: "Patient Swing Trader" },
        timestamp: "8 hours ago",
        content: "My A+ setup on BTC finally printed after two days of waiting. Let the trade play out to my target without interfering. Journaling helped me trust the plan.",
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

function PostCard({ post, onLike, onAddComment }: { post: Post, onLike: (id: string) => void, onAddComment: (id: string, text: string) => void }) {
    const [commentText, setCommentText] = useState("");
    const [showComments, setShowComments] = useState(false);

    const handleCommentSubmit = () => {
        if (commentText.trim()) {
            onAddComment(post.id, commentText);
            setCommentText("");
        }
    };
    
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
                <p className="text-muted-foreground mb-4">{post.content}</p>
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
                    <Button variant="ghost" size="sm" className="flex items-center gap-2" onClick={() => setShowComments(!showComments)}>
                        <MessageSquare className="h-4 w-4" /> {post.comments.length}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 ml-auto">
                        <Bookmark className="h-4 w-4" /> Save
                    </Button>
                </div>
                {showComments && (
                    <div className="mt-4 space-y-4">
                        {post.comments.map((comment, i) => (
                            <div key={i} className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                                <span className="font-semibold text-foreground">{comment.author}: </span>{comment.text}
                            </div>
                        ))}
                        <div className="relative">
                            <Textarea 
                                placeholder="Write a comment..." 
                                className="pr-12"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                            />
                            <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7" onClick={handleCommentSubmit}>
                                <Send className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function CommunityModule({ onSetModule }: CommunityModuleProps) {
    const [posts, setPosts] = useState<Post[]>(mockPosts);
    const [newPostContent, setNewPostContent] = useState("");

    const handleLike = (id: string) => {
        setPosts(posts.map(p => p.id === id ? { ...p, likes: p.likes + 1 } : p));
    };
    
    const handleAddComment = (id: string, text: string) => {
        setPosts(posts.map(p => p.id === id ? { ...p, comments: [...p.comments, {author: "You", text}] } : p));
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
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Community — Discipline & Learning</h1>
                <p className="text-muted-foreground">High-signal reflections, charts, and insights. No signals. No hype.</p>
            </div>
            
            <div className="grid lg:grid-cols-3 gap-8 items-start">
                {/* Main Feed */}
                <div className="lg:col-span-2 space-y-6">
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
                        <PostCard key={post.id} post={post} onLike={handleLike} onAddComment={handleAddComment} />
                    ))}
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-8 sticky top-24">
                     <Card className="bg-muted/30 border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /> Community Leaders</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {leaders.map(leader => (
                                <div key={leader.name} className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={leader.avatar} alt={leader.name} />
                                        <AvatarFallback>{leader.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-foreground">{leader.name}</p>
                                        <p className="text-xs text-muted-foreground">Known for: {leader.knownFor}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                    <Card className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>My Contributions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-center">
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <p className="text-2xl font-bold font-mono">1</p>
                                    <p className="text-xs text-muted-foreground">Posts</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold font-mono">28</p>
                                    <p className="text-xs text-muted-foreground">Likes Received</p>
                                </div>
                                <div>
                                    <p className="text-2xl font-bold font-mono">12</p>
                                    <p className="text-xs text-muted-foreground">Comments</p>
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground/80 italic pt-2">Continued helpful activity can promote you to a Community Leader.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
