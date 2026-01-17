

      "use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageSquare, Bookmark, Crown, BookOpen, Video, ArrowRight, AlertTriangle, Zap, BrainCircuit, Sparkles, Bot, User, ImageUp } from "lucide-react";
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
import { Checkbox } from "./ui/checkbox";


interface CommunityModuleProps {
    onSetModule: (module: any, context?: any) => void;
}

// =================================================================
// LOCAL STORAGE SETUP & DATA MODELS
// =================================================================
const COMMUNITY_STATE_KEY = 'ec_community_state';
const USER_PROFILE_KEY = 'ec_user_profile';
const ARJUN_RECO_KEY = 'ec_arjun_reco';

type Post = {
    id: string;
    author: {
        name: string;
        avatar: string;
        role: 'Leader' | 'Member';
    };
    timestamp: string;
    type: 'Chart' | 'Reflection' | 'Insight';
    isHighSignal: boolean;
    content: string;
    image?: string;
    imageHint?: string;
    trade?: {
        instrument: string;
        result: number;
    };
};

type VideoData = {
    id: string;
    title: string;
    duration: string;
}

type PlaylistData = {
    title: string;
    description: string;
    videos: VideoData[];
}

type OfficialPost = {
    title: string;
    bullets: string[];
    tag: string;
    icon: React.ElementType; // This won't be stored in JSON, but used for rendering
}

type CommunityState = {
    posts: Post[];
    officialPosts: Omit<OfficialPost, 'icon'>[];
    videos: {
        featured: { title: string; description: string; };
        playlists: PlaylistData[];
    };
    likesMap: Record<string, number>;
    commentsMap: Record<string, { author: string; text: string }[]>;
    savedPostIds: string[];
};

type UserProfile = {
    username: string;
    role: 'Member' | 'Leader';
    persona: string;
};

type ArjunRecommendations = {
    recommendedVideoId: string | null;
    recommendedPostIds: string[];
    reason: string;
};

// INITIAL DATA - used if localStorage is empty
const chartPlaceholder = PlaceHolderImages.find(p => p.id === 'video-thumbnail');

const mockPostsData: Omit<Post, 'likes' | 'comments'>[] = [
    {
        id: '1',
        author: { name: "Alex R.", avatar: "/avatars/01.png", role: "Member" },
        timestamp: "2 hours ago",
        type: 'Reflection',
        isHighSignal: true,
        content: "What I saw: My ETH short setup was showing signs of invalidation in a choppy market.\nWhat I did: Instead of hoping, I followed my rules and cut the trade for a small loss.\nWhat I learned: A controlled loss is a win for discipline. The old me would have held and lost more.",
        trade: { instrument: "ETH-PERP", result: -1.0 },
    },
    {
        id: '2',
        author: { name: "Maria S.", avatar: "/avatars/02.png", role: "Leader" },
        timestamp: "8 hours ago",
        type: 'Chart',
        isHighSignal: true,
        content: "Here's the 4H BTC chart I was watching. The key was waiting for a clean break and retest of the $68k level (blue line) before entering. Patience paid off.",
        image: chartPlaceholder?.imageUrl,
        imageHint: chartPlaceholder?.imageHint,
        trade: { instrument: "BTC-PERP", result: 3.2 },
    },
    {
        id: '3',
        author: { name: "Chen W.", avatar: "/avatars/03.png", role: "Member" },
        timestamp: "1 day ago",
        type: 'Insight',
        isHighSignal: false,
        content: "Mental Model: Instead of 'win rate', I'm now tracking my 'rule adherence rate'. My P&L has improved since I started focusing on executing my plan perfectly, regardless of the outcome of a single trade.",
    },
];

const initialCommunityState: CommunityState = {
    posts: mockPostsData,
    likesMap: { '1': 15, '2': 42, '3': 28 },
    commentsMap: {
        '1': [{ author: "Jane D.", text: "That's the way! A red day sticking to the plan is better than a green day breaking rules." }],
        '3': [{ author: "Alex R.", text: "Great insight. Process over outcome." }]
    },
    savedPostIds: [],
    officialPosts: [
        { title: "The Art of the Stop Loss", bullets: ["Why your SL is your best friend.", "How to set it based on volatility, not hope."], tag: "Education" },
        { title: "Market Warning: High VIX", bullets: ["Crypto VIX is in the 'Elevated' zone.", "Consider reducing size and avoiding low-conviction trades."], tag: "Market Warning" },
        { title: "New Feature: Discipline Guardrails", bullets: ["Get real-time warnings in your Trade Planning module.", "Enable them in Performance Analytics."], tag: "Feature Update" },
        { title: "Video: How to Journal a Losing Trade", bullets: ["Turn your losses into your biggest lessons.", "A step-by-step guide to effective reflection."], tag: "New Video" }
    ],
    videos: {
        featured: {
            title: "The Core Loop: How to Use EdgeCipher for Disciplined Trading",
            description: "A 5-minute walkthrough of the Plan -> Execute -> Journal -> Analyze workflow that builds consistency."
        },
        playlists: [
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
        ]
    }
};

const initialUserProfile: UserProfile = {
    username: 'You',
    role: 'Member',
    persona: 'The Determined Trader'
};

const initialArjunRecos: ArjunRecommendations = {
    recommendedVideoId: "discipline_holding",
    recommendedPostIds: ['2'],
    reason: "Your recent analytics show a pattern of exiting winning trades too early. This content may help."
};

// =================================================================
// UI COMPONENTS
// =================================================================

function PostCard({ post, likes, commentsCount, isArjunRecommended, onLike, onDiscuss }: { post: Post, likes: number, commentsCount: number, isArjunRecommended: boolean, onLike: (id: string) => void, onDiscuss: (post: Post) => void }) {
    return (
        <Card id={`post-${post.id}`} className="bg-muted/30 border-border/50">
            <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src={post.author.avatar} alt={post.author.name} />
                            <AvatarFallback>{post.author.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold text-foreground">{post.author.name}</p>
                            <p className="text-xs text-muted-foreground flex items-center gap-2">
                                <Badge variant={post.author.role === 'Leader' ? 'default' : 'secondary'} className={cn(
                                    "px-1.5 py-0 text-[10px]",
                                    post.author.role === 'Leader' ? "bg-primary/80" : "bg-muted-foreground/20"
                                )}>
                                    {post.author.role}
                                </Badge>
                                <span>&bull;</span>
                                <span>{post.timestamp}</span>
                            </p>
                        </div>
                    </div>
                     <div className="flex items-center gap-2 flex-shrink-0">
                        {post.isHighSignal && <Badge variant="outline" className="border-amber-500/30 text-amber-300"><Sparkles className="mr-1 h-3 w-3" /> High-signal</Badge>}
                        {isArjunRecommended && <Badge variant="secondary" className="bg-primary/10 text-primary"><Bot className="mr-1 h-3 w-3" /> Recommended</Badge>}
                        <Badge variant="outline">{post.type}</Badge>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4 whitespace-pre-wrap line-clamp-6">{post.content}</p>
                
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
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50 text-muted-foreground">
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-xs" onClick={() => onLike(post.id)}>
                        <ThumbsUp className="h-4 w-4" /> {likes}
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-xs" disabled>
                        <MessageSquare className="h-4 w-4" /> {commentsCount}
                    </Button>
                    <div className="flex-grow" />
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-xs" onClick={() => onDiscuss(post)}>
                        <Bot className="h-4 w-4" /> Discuss
                    </Button>
                    <Button variant="ghost" size="sm" className="flex items-center gap-2 text-xs">
                        <Bookmark className="h-4 w-4" /> Save
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function ArjunRecommendationBanner({
  arjunRecos,
  posts,
  videosData,
  router,
  pathname
}: {
  arjunRecos: ArjunRecommendations;
  posts: Post[];
  videosData: CommunityState['videos'];
  router: any;
  pathname: string;
}) {
  const recommendedPost = useMemo(() => {
    if (!arjunRecos?.recommendedPostIds?.length) return null;
    return posts.find(p => p.id === arjunRecos.recommendedPostIds[0]);
  }, [posts, arjunRecos]);

  const recommendedVideo = useMemo(() => {
    if (!arjunRecos?.recommendedVideoId || !videosData) return null;
    return videosData.playlists.flatMap(p => p.videos).find(v => v.id === arjunRecos.recommendedVideoId);
  }, [videosData, arjunRecos]);

  const videoThumbnail = PlaceHolderImages.find(p => p.id === 'video-thumbnail');

  if (!recommendedPost && !recommendedVideo) {
    return (
      <Card className="bg-muted/30 border-border/50">
        <CardContent className="p-6 text-center">
          <h3 className="font-semibold text-foreground">No recommendations yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Complete your journal to unlock personalized guidance from Arjun.</p>
        </CardContent>
      </Card>
    )
  }

  const handleWatchVideo = (videoId: string) => {
    const params = new URLSearchParams();
    params.set('video', videoId);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleViewPost = (postId: string) => {
    const element = document.getElementById(`post-${postId}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <Card className="bg-muted/30 border-primary/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          Arjun recommended for you today
        </CardTitle>
        <CardDescription className="text-xs">{arjunRecos.reason}</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        {recommendedPost && (
          <Card className="bg-muted/50">
            <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-foreground">Recommended Post</h4>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{recommendedPost.content}</p>
            </CardHeader>
            <CardFooter>
              <Button size="sm" variant="outline" className="w-full" onClick={() => handleViewPost(recommendedPost.id)}>
                View Post <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
        {recommendedVideo && (
          <Card className="bg-muted/50">
             <CardHeader className="pb-4">
                <div className="flex items-center gap-2 mb-2">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-semibold text-foreground">Recommended Video</h4>
                </div>
                <p className="text-sm text-muted-foreground">{recommendedVideo.title}</p>
            </CardHeader>
            <CardContent>
              {videoThumbnail && (
                <div className="aspect-video bg-muted rounded-md relative overflow-hidden">
                    <Image src={videoThumbnail.imageUrl} alt={recommendedVideo.title} fill style={{ objectFit: 'cover' }} data-ai-hint={videoThumbnail.imageHint || 'video thumbnail'} />
                    <Badge className="absolute bottom-2 right-2 bg-black/50 text-white">{recommendedVideo.duration}</Badge>
                </div>
              )}
            </CardContent>
             <CardFooter>
              <Button size="sm" variant="outline" className="w-full" onClick={() => handleWatchVideo(recommendedVideo.id)}>
                Watch Video <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}

function FeedTab({
    posts,
    officialPosts,
    likesMap,
    commentsMap,
    arjunRecos,
    userProfile,
    onSetModule,
    onLike,
    onCreatePost,
    videosData,
    router,
    pathname,
}: {
    posts: Post[];
    officialPosts: Omit<OfficialPost, 'icon'>[];
    likesMap: Record<string, number>;
    commentsMap: Record<string, { author: string; text: string }[]>;
    arjunRecos: ArjunRecommendations;
    userProfile: UserProfile;
    onSetModule: (module: any, context?: any) => void;
    onLike: (id: string) => void;
    onCreatePost: (post: Omit<Post, 'id' | 'timestamp' | 'author' | 'isHighSignal'>) => void;
    videosData: CommunityState['videos'];
    router: any;
    pathname: string;
}) {
    const [newPostContent, setNewPostContent] = useState("");
    const [newPostCategory, setNewPostCategory] = useState<'Chart' | 'Reflection' | 'Insight'>('Reflection');
    const [postError, setPostError] = useState<string | null>(null);
    const [isChartConfirmed, setIsChartConfirmed] = useState(false);
    
    // Filter states
    const [categoryFilter, setCategoryFilter] = useState<'All' | 'Chart' | 'Reflection' | 'Insight'>('All');
    const [highSignalOnly, setHighSignalOnly] = useState(false);
    const [arjunRecommended, setArjunRecommended] = useState(false);

    const [nudge, setNudge] = useState("");

    const coachingNudges = useMemo(() => [
        "Write what you felt during the trade.",
        "Name one rule you followed (or broke).",
        "What will you do differently next time?",
        "What was the market telling you at the time?",
        "Did this trade align with your core strategy?"
    ], []);

    useEffect(() => {
        setNudge(coachingNudges[Math.floor(Math.random() * coachingNudges.length)]);
        const interval = setInterval(() => {
            setNudge(prevNudge => {
                let newNudge = prevNudge;
                while (newNudge === prevNudge) { newNudge = coachingNudges[Math.floor(Math.random() * coachingNudges.length)]; }
                return newNudge;
            });
        }, 7000);
        return () => clearInterval(interval);
    }, [coachingNudges]);

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            if (categoryFilter !== 'All' && post.type !== categoryFilter) return false;
            if (highSignalOnly && !post.isHighSignal) return false;
            if (arjunRecommended && !arjunRecos.recommendedPostIds.includes(post.id)) return false;
            return true;
        });
    }, [posts, categoryFilter, highSignalOnly, arjunRecommended, arjunRecos]);

    const iconMap: Record<string, React.ElementType> = {
        "Education": BookOpen,
        "Market Warning": AlertTriangle,
        "Feature Update": Zap,
        "New Video": Video
    };

    const handleCreatePost = () => {
        setPostError(null);
        const content = newPostContent.trim();
        if (content.length < 20) {
            setPostError("Post must be at least 20 characters long.");
            return;
        }
        const linkPattern = /(http|https|www\.)/i;
        if (linkPattern.test(content)) {
            setPostError("Community is for learning and reflection — not signals. External links are not allowed.");
            return;
        }
        const signalWords = ["buy now", "sell now", "entry at", "target", "guaranteed", "pump", "dump", "moon"];
        const profanityWords = ["darn", "heck", "shoot"];
        const bannedWords = [...signalWords, ...profanityWords];
        const bannedWordPattern = new RegExp(`\\b(${bannedWords.join('|')})\\b`, 'i');
        if (bannedWordPattern.test(content)) {
            setPostError("Community is for learning and reflection — not signals. Please avoid signal language or profanity.");
            return;
        }

        onCreatePost({
            type: newPostCategory,
            content: newPostContent,
        });

        setNewPostContent("");
        setIsChartConfirmed(false);
    };

    const handleDiscuss = (post: Post) => {
        const prompt = `Arjun, I'm looking at this community post titled "${post.type}" by ${post.author.name}: "${post.content.substring(0, 150)}...". What's your professional take on this? Can you give me some feedback or ask a clarifying question?`;
        onSetModule('aiCoaching', { initialMessage: prompt });
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <ArjunRecommendationBanner
              arjunRecos={arjunRecos}
              posts={posts}
              videosData={videosData}
              router={router}
              pathname={pathname}
            />
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
                    {officialPosts.map((post, index) => {
                      const Icon = iconMap[post.tag] || BrainCircuit;
                      return (
                      <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                        <div className="p-1 h-full">
                            <Card className="bg-muted/50 border-primary/20 h-full">
                                <CardContent className="p-4 flex flex-col items-start gap-4 h-full">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Icon className="h-4 w-4 text-primary" />
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
                    )})}
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
                        <CardDescription>Share a trade breakdown, a psychological insight, or a question for the community.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg text-sm text-primary/90 flex items-center gap-3">
                                <Sparkles className="h-4 w-4 flex-shrink-0" />
                                <p className="italic">{nudge}</p>
                            </div>
                            <Select value={newPostCategory} onValueChange={(v) => { setNewPostCategory(v as any); if (v !== 'Chart') { setIsChartConfirmed(false); } }}>
                                <SelectTrigger className="w-full sm:w-[220px]"><SelectValue placeholder="Select post category..." /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Reflection">Reflection (what I did & learned)</SelectItem>
                                    <SelectItem value="Chart">Chart Analysis (no signals)</SelectItem>
                                    <SelectItem value="Insight">Insight / Mental Model</SelectItem>
                                </SelectContent>
                            </Select>

                            <Textarea placeholder="What did you learn today?" value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className={cn(postError && "border-destructive focus-visible:ring-destructive")} />
                            {postError && (<p className="text-sm text-destructive mt-2">{postError}</p>)}

                            {newPostCategory === 'Chart' && (
                                <div className="flex items-start space-x-3 pt-2">
                                    <Checkbox id="chart-confirm" checked={isChartConfirmed} onCheckedChange={(checked) => setIsChartConfirmed(checked as boolean)} />
                                    <div className="grid gap-1.5 leading-none">
                                        <Label htmlFor="chart-confirm" className="text-sm font-medium">I confirm this is a chart screenshot.</Label>
                                        <p className="text-xs text-muted-foreground">For educational purposes only. Not a buy/sell signal.</p>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div className="flex items-center gap-2">
                                     <Button variant="outline" size="sm" disabled={newPostCategory !== 'Chart'}><ImageUp className="mr-2 h-4 w-4" />Upload Image</Button>
                                    <p className="text-xs text-muted-foreground">Chart uploads only. No links. No buy/sell calls.</p>
                                </div>
                                <div className="flex gap-2 self-end sm:self-center">
                                    <Button variant="ghost" disabled>Save draft</Button>
                                    <Button onClick={handleCreatePost} disabled={newPostCategory === 'Chart' && !isChartConfirmed}>Post</Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {filteredPosts.map(post => (
                    <PostCard 
                        key={post.id} 
                        post={post} 
                        likes={likesMap[post.id] || 0}
                        commentsCount={commentsMap[post.id]?.length || 0}
                        isArjunRecommended={arjunRecos.recommendedPostIds.includes(post.id)}
                        onLike={onLike} 
                        onDiscuss={handleDiscuss} 
                    />
                ))}
            </div>
        </div>
    );
}

function LearnTab({ videosData, highlightedVideoId, onClearHighlight }: { videosData: CommunityState['videos'], highlightedVideoId: string | null; onClearHighlight: () => void; }) {
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

    const { featured: featuredVideo, playlists } = videosData;

    return (
        <div className="max-w-5xl mx-auto space-y-12">
            {highlightedVideoId && (
                <Alert className="bg-primary/10 border-primary/20 text-foreground">
                    <BrainCircuit className="h-4 w-4 text-primary" />
                    <div className="flex items-center justify-between">
                        <div>
                            <AlertTitle className="text-primary">Arjun Recommended This Lesson</AlertTitle>
                            <AlertDescription>This video may help with patterns Arjun has noticed in your recent trading.</AlertDescription>
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
                                    <div key={video.id} ref={el => videoRefs.current[video.id] = el} className={cn("group cursor-pointer p-1", highlightedVideoId === video.id && "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-lg")}>
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

function LeadersTab({ posts, likesMap }: { posts: Post[], likesMap: Record<string, number> }) {
    const leaders = useMemo(() => {
        const leaderContributions: Record<string, { postCount: number, totalLikes: number, avatar: string }> = {};
        posts.forEach(post => {
            if (post.author.role === 'Leader') {
                if (!leaderContributions[post.author.name]) {
                    leaderContributions[post.author.name] = { postCount: 0, totalLikes: 0, avatar: post.author.avatar };
                }
                leaderContributions[post.author.name].postCount++;
                leaderContributions[post.author.name].totalLikes += (likesMap[post.id] || 0);
            }
        });
        
        return Object.entries(leaderContributions).map(([name, data]) => ({
            name,
            avatar: data.avatar,
            score: data.postCount * 10 + data.totalLikes,
            tags: ["Risk Discipline", "Journaling"] // Mock tags
        })).sort((a,b) => b.score - a.score);

    }, [posts, likesMap]);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <Card className="bg-muted/30 border-primary/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Crown className="h-5 w-5 text-primary" /> How to Become a Leader</CardTitle>
                    <CardDescription>Leaders are promoted automatically based on consistent, high-signal contributions to the community—not P&amp;L.</CardDescription>
                </CardHeader>
                <CardContent><p className="text-sm text-muted-foreground">The Leader badge is earned by consistently providing helpful posts, receiving positive engagement (likes, saves), and contributing to a disciplined trading culture.</p></CardContent>
            </Card>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {leaders.map(leader => (
                    <Card key={leader.name} className="bg-muted/30">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Avatar><AvatarImage src={leader.avatar} alt={leader.name} /><AvatarFallback>{leader.name.charAt(0)}</AvatarFallback></Avatar>
                            <div><p className="font-semibold text-foreground">{leader.name}</p><Badge variant="secondary" className="bg-primary/10 text-primary">Leader</Badge></div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                             <div>
                                <p className="text-xs text-muted-foreground font-semibold">Focus Areas</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {leader.tags.map(tag => <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>)}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground font-semibold">Helpful Score</p>
                                <p className="text-lg font-bold font-mono text-foreground">{leader.score}</p>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button variant="outline" className="w-full"><User className="mr-2 h-4 w-4" /> Follow</Button>
                            <Button variant="ghost" className="w-full text-muted-foreground">View Posts</Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}

// =================================================================
// MAIN MODULE COMPONENT
// =================================================================

export function CommunityModule({ onSetModule }: CommunityModuleProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const recommendedVideoIdFromUrl = searchParams.get('video');
    const [isLoading, setIsLoading] = useState(true);

    const [communityState, setCommunityState] = useState<CommunityState | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [arjunRecos, setArjunRecos] = useState<ArjunRecommendations | null>(null);

    const [activeTab, setActiveTab] = useState('feed');
    const [highlightedVideo, setHighlightedVideo] = useState<string | null>(null);

    // Data loading and initialization
    useEffect(() => {
        try {
            // Community State
            const communityStateRaw = localStorage.getItem(COMMUNITY_STATE_KEY);
            if (communityStateRaw) {
                setCommunityState(JSON.parse(communityStateRaw));
            } else {
                localStorage.setItem(COMMUNITY_STATE_KEY, JSON.stringify(initialCommunityState));
                setCommunityState(initialCommunityState);
            }
            // User Profile
            const userProfileRaw = localStorage.getItem(USER_PROFILE_KEY);
            if (userProfileRaw) {
                setUserProfile(JSON.parse(userProfileRaw));
            } else {
                localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(initialUserProfile));
                setUserProfile(initialUserProfile);
            }
            // Arjun Recos
            const arjunRecosRaw = localStorage.getItem(ARJUN_RECO_KEY);
            if (arjunRecosRaw) {
                setArjunRecos(JSON.parse(arjunRecosRaw));
            } else {
                localStorage.setItem(ARJUN_RECO_KEY, JSON.stringify(initialArjunRecos));
                setArjunRecos(initialArjunRecos);
            }
        } catch (e) {
            console.error("Error loading community data from localStorage", e);
            // Fallback to initial state in case of corrupted data
            setCommunityState(initialCommunityState);
            setUserProfile(initialUserProfile);
            setArjunRecos(initialArjunRecos);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // URL param handling
    useEffect(() => {
        const videoId = recommendedVideoIdFromUrl;
        if (videoId) {
            setActiveTab('learn');
            setHighlightedVideo(videoId);
        }
    }, [recommendedVideoIdFromUrl]);

    const updateCommunityState = (updater: (prevState: CommunityState) => CommunityState) => {
        setCommunityState(prevState => {
            if (!prevState) return null;
            const newState = updater(prevState);
            localStorage.setItem(COMMUNITY_STATE_KEY, JSON.stringify(newState));
            return newState;
        });
    };

    const handleLike = (postId: string) => {
        updateCommunityState(prev => ({
            ...prev,
            likesMap: {
                ...prev.likesMap,
                [postId]: (prev.likesMap[postId] || 0) + 1,
            }
        }));
    };

    const handleCreatePost = (newPostData: Omit<Post, 'id' | 'timestamp' | 'author' | 'isHighSignal'>) => {
        if (!userProfile) return;
        const newPost: Post = {
            ...newPostData,
            id: String(Date.now()),
            timestamp: "Just now",
            author: { name: userProfile.username, avatar: "/avatars/user.png", role: userProfile.role },
            isHighSignal: false, // This would be determined by backend logic in a real app
        };
        updateCommunityState(prev => ({
            ...prev,
            posts: [newPost, ...prev.posts]
        }));
    };

    const clearRecommendation = () => {
        setHighlightedVideo(null);
        setArjunRecos(prev => {
            if (!prev) return null;
            const newRecos = { ...prev, recommendedVideoId: null };
            localStorage.setItem(ARJUN_RECO_KEY, JSON.stringify(newRecos));
            return newRecos;
        });
        const params = new URLSearchParams(searchParams.toString());
        params.delete('video');
        router.replace(`${pathname}?${params.toString()}`);
    };

    if (isLoading || !communityState || !userProfile || !arjunRecos) {
        return <div>Loading...</div>; // Or a skeleton loader
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Community — Discipline & Learning</h1>
                <p className="text-muted-foreground">High-signal reflections, charts, and insights. No signals. No hype.</p>
            </div>
            
            <Tabs value={activeTab} onValueChange={(value) => { setActiveTab(value); if(value !== 'learn') { clearRecommendation(); } }} className="w-full">
                <TabsList className="grid w-full grid-cols-3 max-w-lg mx-auto">
                    <TabsTrigger value="feed">Feed</TabsTrigger>
                    <TabsTrigger value="learn">Learn</TabsTrigger>
                    <TabsTrigger value="leaders">Leaders</TabsTrigger>
                </TabsList>
                <TabsContent value="feed" className="mt-8">
                    <FeedTab 
                        posts={communityState.posts}
                        officialPosts={communityState.officialPosts}
                        likesMap={communityState.likesMap}
                        commentsMap={communityState.commentsMap}
                        arjunRecos={arjunRecos}
                        userProfile={userProfile}
                        onSetModule={onSetModule}
                        onLike={handleLike}
                        onCreatePost={handleCreatePost}
                        videosData={communityState.videos}
                        router={router}
                        pathname={pathname}
                    />
                </TabsContent>
                <TabsContent value="learn" className="mt-8">
                    <LearnTab 
                        videosData={communityState.videos} 
                        highlightedVideoId={highlightedVideo} 
                        onClearHighlight={clearRecommendation} 
                    />
                </TabsContent>
                <TabsContent value="leaders" className="mt-8">
                    <LeadersTab posts={communityState.posts} likesMap={communityState.likesMap} />
                </TabsContent>
            </Tabs>
        </div>
    );
}


