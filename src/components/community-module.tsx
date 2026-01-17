
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageSquare, Bookmark, Crown, BookOpen, Video, AlertTriangle, Zap, BrainCircuit, Sparkles, Bot } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "./ui/separator";


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
    type: 'Chart' | 'Reflection' | 'Insight';
    isHighSignal: boolean;
    isArjunRecommended: boolean;
    content: string;
    image?: string;
    imageHint?: string;
    trade?: {
        instrument: string;
        result: number;
    };
    likes: number;
    comments: { author: string; text: string }[];
};

const chartPlaceholder = PlaceHolderImages.find(p => p.id === 'video-thumbnail');

const mockPosts: Post[] = [
    {
        id: '1',
        author: { name: "Alex R.", avatar: "/avatars/01.png", persona: "Disciplined Scalper" },
        timestamp: "2 hours ago",
        type: 'Reflection',
        isHighSignal: true,
        isArjunRecommended: false,
        content: "What I saw: My ETH short setup was showing signs of invalidation in a choppy market.\nWhat I did: Instead of hoping, I followed my rules and cut the trade for a small loss.\nWhat I learned: A controlled loss is a win for discipline. The old me would have held and lost more.",
        trade: { instrument: "ETH-PERP", result: -1.0 },
        likes: 15,
        comments: [{ author: "Jane D.", text: "That's the way! A red day sticking to the plan is better than a green day breaking rules." }],
    },
    {
        id: '2',
        author: { name: "Maria S.", avatar: "/avatars/02.png", persona: "Patient Swing Trader" },
        timestamp: "8 hours ago",
        type: 'Chart',
        isHighSignal: true,
        isArjunRecommended: true,
        content: "Here's the 4H BTC chart I was watching. The key was waiting for a clean break and retest of the $68k level (blue line) before entering. Patience paid off.",
        image: chartPlaceholder?.imageUrl,
        imageHint: chartPlaceholder?.imageHint,
        trade: { instrument: "BTC-PERP", result: 3.2 },
        likes: 42,
        comments: [],
    },
    {
        id: '3',
        author: { name: "Chen W.", avatar: "/avatars/03.png", persona: "Data-Driven Analyst" },
        timestamp: "1 day ago",
        type: 'Insight',
        isHighSignal: false,
        isArjunRecommended: false,
        content: "Mental Model: Instead of 'win rate', I'm now tracking my 'rule adherence rate'. My P&L has improved since I started focusing on executing my plan perfectly, regardless of the outcome of a single trade.",
        likes: 28,
        comments: [{ author: "Alex R.", text: "Great insight. Process over outcome." }],
    },
];

const leaders = [
    { name: "Jane D.", knownFor: "Risk Discipline", avatar: "/avatars/04.png" },
    { name: "Sam K.", knownFor: "Journaling Consistency", avatar: "/avatars/05.png" },
    { name: "Eva L.", knownFor: "Psychology Tips", avatar: "/avatars/01.png" },
];

function PostCard({ post, onLike }: { post: Post, onLike: (id: string) => void }) {
    return (
        <Card className="bg-muted/30 border-border/50">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
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
                     <div className="flex items-center gap-2 flex-shrink-0">
                        {post.isHighSignal && <Badge variant="outline" className="border-amber-500/30 text-amber-300"><Sparkles className="mr-1 h-3 w-3" /> High-signal</Badge>}
                        {post.isArjunRecommended && <Badge variant="secondary" className="bg-primary/10 text-primary"><Bot className="mr-1 h-3 w-3" /> Recommended</Badge>}
                        <Badge variant="outline">{post.type}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4 whitespace-pre-wrap">{post.content}</p>
                
                {post.type === 'Chart' && post.image && (
                    <div className="relative aspect-video rounded-md overflow-hidden border border-border/50 mb-4">
                         <Image src={post.image} alt="Chart analysis" layout="fill" objectFit="cover" data-ai-hint={post.imageHint || 'chart analysis'} />
                    </div>
                )}

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
    
    // Filter states
    const [categoryFilter, setCategoryFilter] = useState<'All' | 'Chart' | 'Reflection' | 'Insight'>('All');
    const [highSignalOnly, setHighSignalOnly] = useState(false);
    const [arjunRecommended, setArjunRecommended] = useState(false);

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            if (categoryFilter !== 'All' && post.type !== categoryFilter) return false;
            if (highSignalOnly && !post.isHighSignal) return false;
            if (arjunRecommended && !post.isArjunRecommended) return false;
            return true;
        });
    }, [posts, categoryFilter, highSignalOnly, arjunRecommended]);

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
            type: 'Reflection',
            isHighSignal: false,
            isArjunRecommended: false,
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

            <Card className="bg-muted/30 border-border/50">
                <CardContent className="p-4 flex flex-col sm:flex-row flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="category-filter" className="text-sm">Category</Label>
                        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as any)}>
                            <SelectTrigger id="category-filter" className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="All">All</SelectItem>
                                <SelectItem value="Chart">Charts</SelectItem>
                                <SelectItem value="Reflection">Reflections</SelectItem>
                                <SelectItem value="Insight">Insights</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Separator orientation="vertical" className="h-6 hidden sm:block" />
                    <div className="flex items-center gap-4">
                        <div className="flex items-center space-x-2">
                            <Switch id="high-signal" checked={highSignalOnly} onCheckedChange={setHighSignalOnly} />
                            <Label htmlFor="high-signal" className="text-sm">High-signal only</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="arjun-recommended" checked={arjunRecommended} onCheckedChange={setArjunRecommended} />
                            <Label htmlFor="arjun-recommended" className="text-sm">Arjun Recommended</Label>
                        </div>
                    </div>
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
                                <Button onClick={handleCreatePost} disabled>Post (Prototype)</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                {filteredPosts.map(post => (
                    <PostCard key={post.id} post={post} onLike={handleLike} />
                ))}
            </div>
        </div>
    );
}

function LearnTab({ highlightedVideoId, onClearHighlight }: { highlightedVideoId: string | null; onClearHighlight: () => void; }) {
    const videoThumbnail = PlaceHolderImages.find(p => p.id === 'video-thumbnail');
    const videoRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        if (highlightedVideoId) {
            const videoElement = videoRefs.current[highlightedVideoId];
            if (videoElement) {
                videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [highlightedVideoId]);

    const featuredVideo = {
        title: "The Core Loop: How to Use EdgeCipher for Disciplined Trading",
        description: "A 5-minute walkthrough of the Plan -> Execute -> Journal -> Analyze workflow that builds consistency."
    };
    const playlists = [
        {
            title: "Mastering Trading Psychology",
            description: "Learn to handle drawdowns, FOMO, and revenge trading.",
            videos: [
                { id: "handling-drawdowns", title: "Handling Drawdowns Like a Pro", duration: "12:30" },
                { id: "fomo-science", title: "The Science of FOMO (and How to Beat It)", duration: "08:45" },
                { id: "discipline_holding", title: "Discipline: Holding Winners to Target", duration: "10:00" },
                { id: "elite-discipline", title: "Building Elite Discipline", duration: "15:10" },
                { id: "journaling-insight", title: "Journaling for Psychological Insight", duration: "11:05" },
            ]
        },
        {
            title: "Advanced Risk Management",
            description: "Techniques to protect your capital and manage your exposure.",
            videos: [
                { id: "position-sizing", title: "Position Sizing for Crypto Futures", duration: "14:55" },
                { id: "vix-risk", title: "Using the VIX to Adapt Your Risk", duration: "09:20" },
                { id: "stop-loss-strategy", title: "Setting Stop Losses That Don't Get Hunted", duration: "18:00" },
            ]
        }
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-12">
            {highlightedVideoId && (
                <Alert className="bg-primary/10 border-primary/20 text-foreground">
                    <BrainCircuit className="h-4 w-4 text-primary" />
                    <div className="flex items-center justify-between">
                        <div>
                            <AlertTitle className="text-primary">Arjun Recommended This Lesson</AlertTitle>
                            <AlertDescription>
                                This video may help with patterns Arjun has noticed in your recent trading.
                            </AlertDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={onClearHighlight}>Clear</Button>
                    </div>
                </Alert>
            )}

            <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle>{featuredVideo.title}</CardTitle>
                    <CardDescription>{featuredVideo.description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative group cursor-pointer overflow-hidden">
                        {videoThumbnail && (
                            <Image src={videoThumbnail.imageUrl} alt="Featured video thumbnail" fill style={{ objectFit: 'cover' }} className="opacity-20 group-hover:opacity-30 transition-opacity" data-ai-hint={videoThumbnail.imageHint} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                        <div className="relative z-10 text-center">
                            <div className="w-20 h-20 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                                <Video className="h-10 w-10" />
                            </div>
                            <p className="font-semibold text-foreground">Watch Now (Prototype)</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-8">
                {playlists.map(playlist => (
                    <Card key={playlist.title} className="bg-muted/30 border-border/50">
                        <CardHeader>
                            <CardTitle>{playlist.title}</CardTitle>
                            <CardDescription>{playlist.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {playlist.videos.map(video => (
                                    <div
                                        key={video.id}
                                        ref={el => videoRefs.current[video.id] = el}
                                        className={cn(
                                            "group cursor-pointer p-1",
                                            highlightedVideoId === video.id && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg"
                                        )}
                                    >
                                        <div className="aspect-video bg-muted rounded-md relative overflow-hidden">
                                            {videoThumbnail && <Image src={videoThumbnail.imageUrl} alt={video.title} fill style={{ objectFit: 'cover' }} data-ai-hint={videoThumbnail.imageHint} />}
                                            <Badge className="absolute bottom-2 right-2 bg-black/50 text-white">{video.duration}</Badge>
                                        </div>
                                        <p className="font-medium text-sm mt-2 text-foreground group-hover:text-primary transition-colors">{video.title}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
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
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const recommendedVideoId = searchParams.get('video');

    const [activeTab, setActiveTab] = useState(recommendedVideoId ? 'learn' : 'feed');
    const [highlightedVideo, setHighlightedVideo] = useState<string | null>(null);

    useEffect(() => {
        if (recommendedVideoId) {
            setActiveTab('learn');
            setHighlightedVideo(recommendedVideoId);
        }
    }, [recommendedVideoId]);

    const clearRecommendation = () => {
        setHighlightedVideo(null);
        const params = new URLSearchParams(searchParams.toString());
        params.delete('video');
        router.replace(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Community — Discipline & Learning</h1>
                <p className="text-muted-foreground">High-signal reflections, charts, and insights. No signals. No hype.</p>
            </div>
            
            <Tabs value={activeTab} onValueChange={(value) => {
                setActiveTab(value);
                if(value !== 'learn') {
                    clearRecommendation();
                }
            }} className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
                    <TabsTrigger value="feed">Feed</TabsTrigger>
                    <TabsTrigger value="learn">Learn</TabsTrigger>
                    <TabsTrigger value="leaders">Leaders</TabsTrigger>
                </TabsList>
                <TabsContent value="feed" className="mt-8">
                    <FeedTab />
                </TabsContent>
                <TabsContent value="learn" className="mt-8">
                    <LearnTab highlightedVideoId={highlightedVideo} onClearHighlight={clearRecommendation} />
                </TabsContent>
                <TabsContent value="leaders" className="mt-8">
                    <LeadersTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
