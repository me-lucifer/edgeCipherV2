

      "use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Filter, Clock, Loader2, ArrowRight, TrendingUp, Zap, Sparkles, Search, X, AlertTriangle, CheckCircle, Bookmark, Timer, Gauge, Star, Calendar, Copy, Clipboard, ThumbsUp, ThumbsDown, Meh, PlusCircle, MoreHorizontal, Save, Grid, Eye, Radio, RefreshCw, Layers, BarChart, FileText, ShieldAlert, Info, HelpCircle, ChevronsUpDown, Crown, ImageUp, MessageSquare, Video, BookOpen, User, BrainCircuit, Flag, Trash2, Edit } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from "./ui/drawer";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";
import { Checkbox } from "./ui/checkbox";
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useRiskState } from "@/hooks/use-risk-state";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { ScrollArea } from "./ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Input } from "./ui/input";
import { formatDistanceToNow } from "date-fns";


interface CommunityModuleProps {
    onSetModule: (module: any, context?: any) => void;
    context?: {
        openCreatePost?: 'Reflection';
    }
}

// =================================================================
// LOCAL STORAGE SETUP & DATA MODELS
// =================================================================
const COMMUNITY_STATE_KEY = 'ec_community_state';
const USER_PROFILE_KEY = 'ec_user_profile';
const ARJUN_RECO_KEY = 'ec_arjun_reco';
const WATCHED_VIDEOS_KEY = 'ec_watched_videos';
const FOLLOWED_USERS_KEY = 'ec_followed_users';
const HIDDEN_POSTS_KEY = 'ec_hidden_post_ids';
const ITEMS_PER_PAGE = 9;

type Post = {
    id: string;
    author: {
        name: string;
        avatar: string;
        role: 'Leader' | 'Member';
    };
    timestamp: string;
    editedAt?: string;
    type: 'Chart' | 'Reflection' | 'Insight';
    isHighSignal: boolean;
    content: string;
    image?: string;
    imageHint?: string;
    trade?: {
        instrument: string;
        result: number;
    };
    isFlagged?: boolean;
    flagReason?: string;
};

type VideoData = {
    id: string;
    title: string;
    description: string;
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
    icon?: React.ElementType; // This won't be stored in JSON, but used for rendering
}

type CommunityState = {
    posts: Post[];
    officialPosts: Omit<OfficialPost, 'icon'>[];
    videos: {
        featured: { title: string; description: string; };
        playlists: PlaylistData[];
    };
    likesMap: Record<string, number>;
    savesMap: Record<string, number>;
    commentsMap: Record<string, { author: string; text: string }[]>;
    savedPostIds: string[];
    personaRecommendedPostIds: string[];
};

type UserProfile = {
    username: string;
    role: 'Member' | 'Leader' | 'Admin';
    persona: string;
};

type ArjunRecommendations = {
    recommendedVideoId: string | null;
    recommendedPostIds: string[];
    reason: string;
};

// INITIAL DATA - used if localStorage is empty
const chartPlaceholder = PlaceHolderImages.find(p => p.id === 'video-thumbnail');

const mockPostsData: Omit<Post, 'likes' | 'comments' | 'saves'>[] = [
    {
        id: '1',
        author: { name: "Alex R.", avatar: "/avatars/01.png", role: "Member" },
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        type: 'Reflection',
        isHighSignal: true,
        content: "What I saw: My ETH short setup was showing signs of invalidation in a choppy market.\nWhat I did: Instead of hoping, I followed my rules and cut the trade for a small loss.\nWhat I learned: A controlled loss is a win for discipline. The old me would have held and lost more.",
        trade: { instrument: "ETH-PERP", result: -1.0 },
    },
    {
        id: '2',
        author: { name: "Maria S.", avatar: "/avatars/02.png", role: "Leader" },
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        type: 'Chart',
        isHighSignal: true,
        content: "Setup Idea: BTC 4H is consolidating. A clean break above $68.5k could be a trend continuation setup.\nRisk Plan: My plan would be to enter on a retest, with an SL below the range midpoint to invalidate the idea. This is for analysis only, not a signal.",
        image: chartPlaceholder?.imageUrl,
        imageHint: chartPlaceholder?.imageHint,
    },
    {
        id: '3',
        author: { name: "Chen W.", avatar: "/avatars/03.png", role: "Member" },
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        type: 'Insight',
        isHighSignal: false,
        content: "Mental Model: Instead of 'win rate', I'm now tracking my 'rule adherence rate'. My P&L has improved since I started focusing on executing my plan perfectly, regardless of the outcome of a single trade.",
    },
    {
        id: '4',
        author: { name: "Jane D.", avatar: "/avatars/04.png", role: "Leader" },
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'Insight',
        isHighSignal: true,
        content: "My pre-trade checklist:\n1. Does this fit one of my defined strategies?\n2. Is the market context (VIX, news) favorable?\n3. Have I defined my entry, SL, and TP in my plan?\n4. Am I emotionally neutral?\nIf any answer is 'no', I don't take the trade.",
    },
    {
        id: '5',
        author: { name: "Sam K.", avatar: "/avatars/05.png", role: "Member" },
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'Reflection',
        isHighSignal: false,
        content: "Mistake: I took a revenge trade after a small loss and it turned into a much bigger one.\nLesson: My cooldown rule (1 hour break after 2 losses) is there for a reason. Need to respect it. Closed the platform for the rest of the day.",
        trade: { instrument: "SOL-PERP", result: -2.5 },
    }
];

const initialCommunityState: CommunityState = {
    posts: mockPostsData as Post[],
    likesMap: { '1': 15, '2': 42, '3': 28, '4': 55, '5': 18 },
    savesMap: { '1': 5, '2': 20, '3': 12, '4': 30, '5': 7 },
    commentsMap: {
        '1': [{ author: "Jane D.", text: "That's the way! A red day sticking to the plan is better than a green day breaking rules." }],
        '2': [],
        '3': [{ author: "Alex R.", text: "Great insight. Process over outcome." }],
        '4': [{ author: "Chen W.", text: "This is so important. My checklist has saved me from so many bad trades." }],
        '5': []
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
                title: "Psychology",
                description: "Master the mental game of trading.",
                videos: [
                    { id: "handling-drawdowns", title: "Handling Drawdowns Like a Pro", description: "Learn to stay objective and recover from losses.", duration: "12:30" },
                    { id: "fomo-science", title: "The Science of FOMO", description: "Understand what drives FOMO and how to beat it.", duration: "08:45" },
                    { id: "elite-discipline", title: "Building Elite Discipline", description: "Techniques to make rule-following a habit.", duration: "15:10" },
                ]
            },
            {
                title: "Discipline",
                description: "The bridge between your strategy and consistent results.",
                videos: [
                     { id: "discipline_holding", title: "Discipline: Holding Winners to Target", description: "Avoid taking profits too early.", duration: "10:00" },
                     { id: "revenge-trading", title: "How to Stop Revenge Trading", description: "Break the cycle of making back losses.", duration: "09:15" },
                     { id: "checklist-power", title: "The Power of a Pre-Trade Checklist", description: "Your final check before risking capital.", duration: "07:50" },
                ]
            },
            {
                title: "Trade Planning",
                description: "How to build a complete, testable trade plan.",
                videos: [
                    { id: "aplus-setup", title: "Anatomy of an A+ Setup", description: "Define the exact conditions for your best trades.", duration: "11:40" },
                    { id: "stop-loss-strategy", title: "Setting Stops That Don't Get Hunted", description: "Place your SL based on logic, not hope.", duration: "18:00" },
                    { id: "rr-strategy", title: "Defining Your R:R Strategy", description: "Understand the math behind profitable trading.", duration: "13:25" },
                ]
            }
        ]
    },
    personaRecommendedPostIds: [],
};


const initialUserProfile: UserProfile = {
    username: 'You',
    role: 'Member',
    persona: 'Impulsive Sprinter'
};

const initialArjunRecos: ArjunRecommendations = {
    recommendedVideoId: "discipline_holding",
    recommendedPostIds: ['2'],
    reason: "Your recent analytics show a pattern of exiting winning trades too early. This content may help."
};

// =================================================================
// UI COMPONENTS
// =================================================================

const commentSchema = z.object({
    comment: z.string()
      .min(5, "Comment must be at least 5 characters.")
});


function PostCard({ post, likes, comments, isArjunRecommended, recommendationReason, isHidden, isAdmin, onLike, onSave, onDiscuss, onAddComment, onReport, onHide, onDelete, onMarkAsOfficial, userProfile, onUpdatePost }: { post: Post, likes: number, comments: { author: string; text: string }[], isArjunRecommended: boolean, recommendationReason?: string, isHidden: boolean, isAdmin: boolean, onLike: (id: string) => void, onSave: (id: string) => void, onDiscuss: (post: Post) => void, onAddComment: (postId: string, comment: string) => void, onReport: (id: string, type: 'post' | 'comment') => void, onHide: (id: string) => void, onDelete: (id: string) => void, onMarkAsOfficial: (post: Post) => void, userProfile: UserProfile, onUpdatePost: (postId: string, newContent: string) => void }) {
    const form = useForm<z.infer<typeof commentSchema>>({
        resolver: zodResolver(commentSchema),
        defaultValues: { comment: "" },
    });
    const [isExpanded, setIsExpanded] = React.useState(false);
    const [isCommentsOpen, setIsCommentsOpen] = React.useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(post.content);
    
    const CONTENT_LENGTH_THRESHOLD = 300;

    const isOwner = userProfile.username === post.author.name;

    const canEdit = useMemo(() => {
        if (!isOwner) return false;
        const postDate = new Date(post.timestamp);
        const now = new Date();
        const diffInMinutes = (now.getTime() - postDate.getTime()) / (1000 * 60);
        return diffInMinutes < 10;
    }, [post.timestamp, isOwner]);

    function onSubmit(values: z.infer<typeof commentSchema>) {
        onAddComment(post.id, values.comment);
        form.reset();
    }
    
    const handleSaveEdit = () => {
        onUpdatePost(post.id, editedContent);
        setIsEditing(false);
    };

    return (
        <Card id={`post-${post.id}`} className={cn("bg-muted/30 border-border/50", isHidden && "opacity-50 border-dashed border-destructive/50")}>
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
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <span>{formatDistanceToNow(new Date(post.timestamp), { addSuffix: true })}</span>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>{new Date(post.timestamp).toLocaleString()}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                                 {post.editedAt && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger>
                                                <span className="italic">(edited)</span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Edited at {new Date(post.editedAt).toLocaleString()}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {isHidden && <Badge variant="destructive">Hidden</Badge>}
                        {post.isHighSignal && <Badge variant="outline" className="border-amber-500/30 text-amber-300"><Sparkles className="mr-1 h-3 w-3" /> High-signal</Badge>}
                        {isArjunRecommended && (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Badge variant="secondary" className="bg-primary/10 text-primary cursor-help"><Bot className="mr-1 h-3 w-3" /> Recommended</Badge>
                                    </TooltipTrigger>
                                    {recommendationReason && (
                                        <TooltipContent>
                                            <p>{recommendationReason}</p>
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TooltipProvider>
                        )}
                        <Badge variant="outline">{post.type}</Badge>
                         <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {isOwner && (
                                    <DropdownMenuItem onSelect={() => setIsEditing(true)} disabled={!canEdit}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Post
                                        {!canEdit && <span className="text-xs ml-auto text-muted-foreground">(Locked)</span>}
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onSelect={() => onReport(post.id, 'post')}>
                                    <Flag className="mr-2 h-4 w-4" /> Report Post
                                </DropdownMenuItem>
                                {isAdmin && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={() => onHide(post.id)}>
                                            <Eye className="mr-2 h-4 w-4" /> {isHidden ? 'Unhide' : 'Hide'} Post
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => onMarkAsOfficial(post)}>
                                            <Star className="mr-2 h-4 w-4" /> Mark as Official
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => onDelete(post.id)}>
                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Post
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {post.isFlagged && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>Post Flagged for Review</AlertTitle>
                        <AlertDescription>
                            Reason: {post.flagReason || 'Content policy violation'}.
                        </AlertDescription>
                    </Alert>
                )}
                 {isEditing ? (
                    <div className="space-y-2 mb-4">
                        <Textarea value={editedContent} onChange={(e) => setEditedContent(e.target.value)} className="min-h-[120px]" />
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => { setIsEditing(false); setEditedContent(post.content); }}>Cancel</Button>
                            <Button size="sm" onClick={handleSaveEdit}>Save Changes</Button>
                        </div>
                    </div>
                ) : (
                    <p className={cn("text-muted-foreground mb-4 whitespace-pre-wrap", !isExpanded && "line-clamp-6")}>{post.content}</p>
                )}
                
                 {post.type === 'Chart' && post.image && (
                    <Dialog>
                        <div className="mb-4">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <DialogTrigger asChild>
                                            <div className="relative aspect-video rounded-md overflow-hidden border border-border/50 cursor-pointer group">
                                                <Image src={post.image} alt="Chart analysis" layout="fill" objectFit="cover" data-ai-hint={post.imageHint || 'chart analysis'} />
                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                    <Search className="h-8 w-8 text-white" />
                                                </div>
                                            </div>
                                        </DialogTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Charts are for learning, not signals. Click to expand.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            <p className="text-xs text-muted-foreground mt-2">
                                Context: {post.content.split('\n')[0]}
                            </p>
                        </div>

                        <DialogContent className="max-w-4xl p-2 bg-background border-border">
                            <div className="relative aspect-video">
                                <Image src={post.image} alt="Chart analysis" layout="fill" objectFit="contain" />
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

                {post.trade && (
                    <div className="p-3 rounded-md bg-muted/50 border border-border/50 flex items-center justify-between text-sm">
                        <span className="font-mono text-foreground">{post.trade.instrument}</span>
                        <span className={cn("font-semibold font-mono", post.trade.result > 0 ? "text-green-400" : "text-red-400")}>
                            {post.trade.result > 0 ? '+' : ''}{post.trade.result.toFixed(2)}R
                        </span>
                    </div>
                )}
            </CardContent>
             <CardFooter className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50 text-muted-foreground">
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-xs" onClick={() => onLike(post.id)}>
                    <ThumbsUp className="h-4 w-4" /> {likes}
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-xs" onClick={() => setIsCommentsOpen(prev => !prev)}>
                    <MessageSquare className="h-4 w-4" /> {comments.length}
                </Button>
                <div className="flex-grow" />

                {post.content.length > CONTENT_LENGTH_THRESHOLD && (
                    <Button variant="link" size="sm" className="text-xs text-muted-foreground" onClick={() => setIsExpanded(prev => !prev)}>
                        {isExpanded ? 'Show less' : 'Read more'}
                    </Button>
                )}

                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-xs" onClick={() => onDiscuss(post)}>
                    <Bot className="h-4 w-4" /> Discuss
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 text-xs" onClick={() => onSave(post.id)}>
                    <Bookmark className="h-4 w-4" /> Save
                </Button>
            </CardFooter>
            <Collapsible open={isCommentsOpen}>
                <CollapsibleContent>
                    <CardContent className="pt-4 border-t">
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h4 className="text-sm font-semibold text-foreground">Comments</h4>
                                <div className="text-xs text-muted-foreground">Sort by: Top (soon)</div>
                            </div>
                            {comments.map((comment, index) => (
                                <div key={index} className="flex items-start gap-3 group">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={`/avatars/${comment.author.toLowerCase().replace(/\s/g, '').replace('.', '')}.png`} alt={comment.author} />
                                        <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-foreground">{comment.author}</p>
                                        <p className="text-sm text-muted-foreground">{comment.text}</p>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onSelect={() => onReport(`${post.id}-${index}`, 'comment')}>
                                                <Flag className="mr-2 h-4 w-4" /> Report Comment
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            ))}
                            {comments.length === 0 && <p className="text-sm text-center text-muted-foreground py-4">Be the first to comment.</p>}
                            
                            <Separator className="my-4" />

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                                    <FormField
                                        control={form.control}
                                        name="comment"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea placeholder="Add a thoughtful comment..." {...field} />
                                                </FormControl>
                                                <p className="text-xs text-muted-foreground">Ask about process: setup, risk, mindset. Avoid predictions.</p>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="flex justify-end items-center">
                                        <Button type="submit" size="sm">Post Comment</Button>
                                    </div>
                                </form>
                            </Form>
                        </div>
                    </CardContent>
                </CollapsibleContent>
            </Collapsible>
        </Card>
    );
}

function ArjunHighlightsStrip({
  arjunRecos,
  posts,
  onPostClick,
  userProfile,
  personaRecommendedPostIds,
}: {
  arjunRecos: ArjunRecommendations;
  posts: Post[];
  onPostClick: (postId: string) => void;
  userProfile: UserProfile;
  personaRecommendedPostIds: string[];
}) {
  const recommendedPosts = useMemo(() => {
    const allRecommendedIds = [
      ...(arjunRecos?.recommendedPostIds || []),
      ...(personaRecommendedPostIds || []),
    ];
    const uniqueIds = [...new Set(allRecommendedIds)];

    const recommended = uniqueIds.map(id => posts.find(p => p.id === id)).filter(Boolean) as Post[];

    const reflection = recommended.find(p => p.type === 'Reflection');
    const insight = recommended.find(p => p.type === 'Insight');
    const chart = recommended.find(p => p.type === 'Chart');
    
    const highlights = new Set([reflection, insight, chart].filter(Boolean) as Post[]);
    
    if (highlights.size < 3) {
      for (const p of recommended) {
        if (highlights.size >= 3) break;
        highlights.add(p);
      }
    }
    
    return Array.from(highlights);

  }, [posts, arjunRecos, personaRecommendedPostIds]);

  if (recommendedPosts.length === 0) {
    return null;
  }

  return (
    <Card className="bg-muted/30 border-primary/20">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2 text-primary">
          <Sparkles className="h-4 w-4" />
          Highlights for you today
        </CardTitle>
        <CardDescription className="text-xs">Based on your recent activity and persona.</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendedPosts.map(post => {
            const isArjunRecommended = (arjunRecos?.recommendedPostIds || []).includes(post.id);
            const reason = isArjunRecommended 
                ? arjunRecos.reason 
                : `Recommended based on your '${userProfile.persona}' persona.`;
            
            const title = post.content.split('\n')[0].split('. ')[0];

            return (
                 <Card key={post.id} className="bg-muted/50 h-full flex flex-col">
                    <CardHeader className="pb-4">
                         <div className="flex items-start justify-between">
                            <h4 className="font-semibold text-foreground leading-tight line-clamp-2 pr-2">{title}</h4>
                             <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p className="max-w-xs">{reason}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </CardHeader>
                     <CardContent className="flex-1">
                        <Badge variant="outline">{post.type}</Badge>
                    </CardContent>
                    <CardFooter>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => onPostClick(post.id)}>
                        Open Post <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
            )
        })}
      </CardContent>
    </Card>
  );
}

function AdminToolsCard({ showFlaggedOnly, onToggleFlaggedOnly, flaggedCount, hiddenCount }: { showFlaggedOnly: boolean; onToggleFlaggedOnly: (show: boolean) => void; flaggedCount: number; hiddenCount: number; }) {
    return (
        <Card className="bg-destructive/10 border-destructive/20">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-5 w-5 text-destructive" />Admin Tools</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border/50 p-3 bg-muted/50">
                    <div className="space-y-0.5">
                        <Label htmlFor="show-flagged">Show flagged only</Label>
                        <p className="text-xs text-muted-foreground">{flaggedCount} posts flagged</p>
                    </div>
                    <Switch
                        id="show-flagged"
                        checked={showFlaggedOnly}
                        onCheckedChange={onToggleFlaggedOnly}
                    />
                </div>
                <p className="text-xs text-muted-foreground">{hiddenCount} posts currently hidden.</p>
                <p className="text-xs text-muted-foreground/80 italic">Set your role to "Admin" in localStorage key 'ec_user_profile' to see these tools.</p>
            </CardContent>
        </Card>
    );
}


function FeedTab({
    posts,
    officialPosts,
    likesMap,
    commentsMap,
    savesMap,
    arjunRecos,
    userProfile,
    onSetModule,
    onLike,
    onSave,
    onCreatePost,
    videosData,
    onPostClick,
    onVideoClick,
    personaRecommendedPostIds,
    onAddComment,
    followedUsers,
    createPostRef,
    initialCategory,
    onReport,
    isAdmin,
    hiddenPostIds,
    onHidePost,
    onDeletePost,
    onMarkAsOfficial,
    onCreateOfficialPost,
    onUpdatePost,
}: {
    posts: Post[];
    officialPosts: Omit<OfficialPost, 'icon'>[];
    likesMap: Record<string, number>;
    commentsMap: Record<string, { author: string; text: string }[]>;
    savesMap: Record<string, number>;
    arjunRecos: ArjunRecommendations;
    userProfile: UserProfile;
    onSetModule: (module: any, context?: any) => void;
    onLike: (id: string) => void;
    onSave: (id: string) => void;
    onCreatePost: (post: Omit<Post, 'id' | 'timestamp' | 'author' | 'isHighSignal'>) => void;
    onCreateOfficialPost: (post: Omit<OfficialPost, 'icon'>) => void;
    videosData: CommunityState['videos'];
    onPostClick: (postId: string) => void;
    onVideoClick: (videoId: string) => void;
    personaRecommendedPostIds: string[];
    onAddComment: (postId: string, comment: string) => void;
    followedUsers: string[];
    createPostRef: React.RefObject<HTMLDivElement>;
    initialCategory?: 'Reflection';
    onReport: (id: string, type: 'post' | 'comment') => void;
    isAdmin: boolean;
    hiddenPostIds: string[];
    onHidePost: (id: string) => void;
    onDeletePost: (id: string) => void;
    onMarkAsOfficial: (post: Post) => void;
    onUpdatePost: (postId: string, newContent: string) => void;
}) {
    const { toast } = useToast();
    const [newPostContent, setNewPostContent] = useState("");
    const [newPostCategory, setNewPostCategory] = useState<'Chart' | 'Reflection' | 'Insight'>(initialCategory || 'Reflection');
    const [postError, setPostError] = useState<string | null>(null);
    const [isChartConfirmed, setIsChartConfirmed] = useState(false);
    
    const [nudge, setNudge] = useState("");
    const { riskState } = useRiskState();
    const [isNewsDrivenDay, setIsNewsDrivenDay] = useState(false);

    const [isCreateOfficialOpen, setIsCreateOfficialOpen] = useState(false);
    const [newOfficialTitle, setNewOfficialTitle] = useState("");
    const [newOfficialBullets, setNewOfficialBullets] = useState("");
    const [newOfficialTag, setNewOfficialTag] = useState<string>("Education");


    useEffect(() => {
        const checkNewsSignal = () => {
            const newsSignal = localStorage.getItem('ec_news_day_signal');
            if (newsSignal) {
                try {
                    setIsNewsDrivenDay(JSON.parse(newsSignal).isNewsDrivenDay);
                } catch(e) {
                    setIsNewsDrivenDay(false);
                }
            } else {
                 setIsNewsDrivenDay(false);
            }
        };
        checkNewsSignal();
        const storageHandler = (e: StorageEvent) => {
            if (e.key === 'ec_news_day_signal') {
                checkNewsSignal();
            }
        };
        window.addEventListener('storage', storageHandler);
        return () => window.removeEventListener('storage', storageHandler);
    }, []);

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

    // Filter states
    const [categoryFilter, setCategoryFilter] = useState<'All' | 'Chart' | 'Reflection' | 'Insight'>('All');
    const [highSignalOnly, setHighSignalOnly] = useState(false);
    const [sortBy, setSortBy] = useState<'newest' | 'mostHelpful' | 'arjunPicks' | 'following'>('newest');
    const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
    const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

    useEffect(() => {
        setVisibleCount(ITEMS_PER_PAGE);
    }, [categoryFilter, highSignalOnly, sortBy, showFlaggedOnly]);

    const reflectionPlaceholder = `What was the plan?
- e.g., Planned to enter BTC long on a retest of 68k.

What did I actually do?
- e.g., Entered early out of FOMO.

What emotion showed up?
- e.g., Felt anxious and impatient.

What is the lesson?
- e.g., Stick to the plan. Waiting for confirmation prevents chasing bad entries.`;

    const postsToRender = useMemo(() => {
      let items = [...posts];

      // Admin filters first
      if (isAdmin && showFlaggedOnly) {
          items = items.filter(p => p.isFlagged);
      }

      // Filter hidden posts for non-admins
      if (!isAdmin) {
          items = items.filter(p => !hiddenPostIds.includes(p.id));
      }

      if (categoryFilter !== 'All') {
          items = items.filter(post => post.type === categoryFilter);
      }
      
      if (highSignalOnly) {
          items = items.filter(p => p.isHighSignal);
      }
      
      switch (sortBy) {
          case 'newest':
              // Default order is assumed to be newest first
              break;
          case 'mostHelpful':
              items.sort((a, b) => {
                  const scoreA = (likesMap[a.id] || 0) * 1 + (savesMap[a.id] || 0) * 2 + (commentsMap[a.id]?.length || 0) * 1 + (a.isHighSignal ? 3 : 0);
                  const scoreB = (likesMap[b.id] || 0) * 1 + (savesMap[b.id] || 0) * 2 + (commentsMap[b.id]?.length || 0) * 1 + (b.isHighSignal ? 3 : 0);
                  return scoreB - scoreA;
              });
              break;
          case 'arjunPicks':
              items = items.filter(post => 
                  arjunRecos.recommendedPostIds.includes(post.id) || 
                  (personaRecommendedPostIds || []).includes(post.id)
              );
              break;
          case 'following':
              items = items.filter(post => followedUsers.includes(post.author.name));
              break;
      }

      return items;
    }, [posts, categoryFilter, highSignalOnly, sortBy, likesMap, savesMap, commentsMap, arjunRecos, personaRecommendedPostIds, followedUsers, isAdmin, showFlaggedOnly, hiddenPostIds]);


    const displayedOfficialPosts = useMemo(() => {
        const isHighRisk = riskState?.decision.level === 'red' || isNewsDrivenDay;
        
        if (isHighRisk) {
            const pinnedPost: OfficialPost = {
                title: "Market Warning: Volatility elevated — reduce risk.",
                bullets: ["VIX is high or a market-moving news event is active.", "Consider reducing size, widening stops, or staying flat."],
                tag: "Pinned by Arjun",
                icon: AlertTriangle,
            };
            return [pinnedPost, ...officialPosts];
        }
        
        return officialPosts;
    }, [officialPosts, riskState, isNewsDrivenDay]);

    const iconMap: Record<string, React.ElementType> = {
        "Education": BookOpen,
        "Market Warning": AlertTriangle,
        "Feature Update": Zap,
        "New Video": Video,
        "Pinned by Arjun": AlertTriangle,
    };

    const handleCreatePost = () => {
        const now = Date.now();
        const TEN_MINUTES_MS = 10 * 60 * 1000;
        const postTimestamps: number[] = JSON.parse(localStorage.getItem('ec_post_timestamps') || '[]');
        const recentTimestamps = postTimestamps.filter(ts => now - ts < TEN_MINUTES_MS);

        if (recentTimestamps.length >= 3) {
            toast({
                title: "Rate Limit Exceeded",
                description: "Slow down — community is for high-signal reflections. Please wait a few minutes.",
                variant: "destructive"
            });
            return;
        }

        setPostError(null);
        const content = newPostContent.trim();
        
        if (content.length < 20) {
            setPostError("Post must be at least 20 characters long.");
            return;
        }

        let isFlagged = false;
        let flagReason = '';

        const linkPattern = /(http|https|www\.)/i;
        if (linkPattern.test(content)) {
            isFlagged = true;
            flagReason = 'Contains Link/Promotion';
        }

        const profanityWords = ["darn", "heck", "shoot"]; // keeping it mild
        const profanityRegex = new RegExp(`\\b(${profanityWords.join('|')})\\b`, 'i');
        if (profanityRegex.test(content)) {
            isFlagged = true;
            flagReason = 'Contains Profanity';
        }

        const signalKeywords = ["entry", "target", "buy now", "sell now", "guaranteed", "pump", "dump", "moon", "signal", "sl at", "tp at"];
        const signalRegex = new RegExp(`\\b(${signalKeywords.join('|')})\\b`, 'i');
        if (!isFlagged && signalRegex.test(content)) {
            isFlagged = true;
            flagReason = 'Potential Signal Language';
        }

        onCreatePost({
            type: newPostCategory,
            content: newPostContent,
            isFlagged,
            flagReason,
        } as any);

        localStorage.setItem('ec_post_timestamps', JSON.stringify([...recentTimestamps, now]));

        setNewPostContent("");
        setIsChartConfirmed(false);
        setPostError(null);
    };
    
    const handleSaveDraft = () => {
        if (newPostContent.trim()) {
            const draft = {
                category: newPostCategory,
                content: newPostContent,
            };
            localStorage.setItem('ec_community_drafts', JSON.stringify(draft));
            toast({ title: 'Draft Saved' });
        }
    };


    const handleDiscuss = (post: Post) => {
        const prompt = `Arjun, I'm looking at this community post titled "${post.type}" by ${post.author.name}: "${post.content.substring(0, 150)}...". What's your professional take on this? Can you give me some feedback or ask a clarifying question?`;
        onSetModule('aiCoaching', { initialMessage: prompt });
    };

    const handleCreateOfficialPostClick = () => {
        if (!newOfficialTitle.trim() || !newOfficialBullets.trim()) {
            toast({
                title: "Missing fields",
                description: "Please provide a title and at least one bullet point.",
                variant: "destructive"
            });
            return;
        }
        const bulletsArray = newOfficialBullets.split('\n').filter(b => b.trim() !== '');
        if (bulletsArray.length > 3) {
            toast({
                title: "Too many bullet points",
                description: "Please provide a maximum of 3 bullet points.",
                variant: "destructive"
            });
            return;
        }

        onCreateOfficialPost({
            title: newOfficialTitle,
            bullets: bulletsArray,
            tag: newOfficialTag
        });

        setIsCreateOfficialOpen(false);
        setNewOfficialTitle("");
        setNewOfficialBullets("");
        setNewOfficialTag("Education");
    };

    return (
        <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Main Column */}
            <div className="lg:col-span-2 space-y-8">
                 <Dialog>
                    <Card className="bg-muted/30 border-border/50">
                      <CardHeader>
                         <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    EdgeCipher
                                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">Official</Badge>
                                </CardTitle>
                                <CardDescription>Key updates and educational content from the team.</CardDescription>
                            </div>
                             <DialogTrigger asChild>
                                <Button variant="outline" size="sm">View All</Button>
                            </DialogTrigger>
                        </div>
                      </CardHeader>
                      <CardContent className="h-[250px]">
                        <Carousel opts={{ align: "start" }} className="w-full h-full">
                          <CarouselContent className="-ml-4 h-full">
                            {displayedOfficialPosts.map((post, index) => {
                              const Icon = post.icon || iconMap[post.tag] || BrainCircuit;
                              const isPinned = post.tag === "Pinned by Arjun";
                              return (
                              <CarouselItem key={index} className="pl-4 md:basis-1/2 lg:basis-1/3">
                                <div className="p-1 h-full">
                                    <Card className={cn("bg-muted/50 h-full", isPinned ? "border-destructive/50" : "border-primary/20")}>
                                        <CardContent className="p-4 flex flex-col items-start gap-4 h-full">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Icon className={cn("h-4 w-4", isPinned ? "text-destructive" : "text-primary")} />
                                                    <p className="font-semibold text-foreground text-sm">{post.title}</p>
                                                </div>
                                                <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1">
                                                    {post.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
                                                </ul>
                                            </div>
                                            <Badge variant={isPinned ? "destructive" : "secondary"} className={cn(isPinned ? "" : "bg-primary/10 text-primary")}>
                                                {isPinned && <Sparkles className="mr-1.5 h-3 w-3" />}
                                                {post.tag}
                                            </Badge>
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
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Official Posts</DialogTitle>
                            <DialogDescription>Key updates and educational content from the team.</DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="max-h-[60vh] pr-6">
                            <div className="space-y-4">
                                {displayedOfficialPosts.map((post, index) => {
                                    const Icon = post.icon || iconMap[post.tag] || BrainCircuit;
                                    const isPinned = post.tag === "Pinned by Arjun";
                                    return (
                                        <Card key={index} className={cn("bg-muted/50", isPinned ? "border-destructive/50" : "border-primary/20")}>
                                            <CardContent className="p-4 flex items-start gap-4">
                                                <Icon className={cn("h-5 w-5 mt-1 flex-shrink-0", isPinned ? "text-destructive" : "text-primary")} />
                                                <div className="flex-1">
                                                    <p className="font-semibold text-foreground text-sm">{post.title}</p>
                                                    <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 mt-2">
                                                        {post.bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}
                                                    </ul>
                                                </div>
                                                <Badge variant={isPinned ? "destructive" : "secondary"} className={cn("text-xs", isPinned ? "" : "bg-primary/10 text-primary")}>
                                                    {isPinned && <Sparkles className="mr-1.5 h-3 w-3" />}
                                                    {post.tag}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                        <DialogFooter className="mt-4 border-t pt-4">
                            {isAdmin && (
                                <Button onClick={() => setIsCreateOfficialOpen(true)}>
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create Official Post
                                </Button>
                            )}
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                
                 <Dialog open={isCreateOfficialOpen} onOpenChange={setIsCreateOfficialOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Official Post</DialogTitle>
                            <DialogDescription>
                                This post will appear in the official carousel for all users.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="official-title">Title</Label>
                                <Input id="official-title" value={newOfficialTitle} onChange={e => setNewOfficialTitle(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="official-tag">Tag</Label>
                                <Select value={newOfficialTag} onValueChange={setNewOfficialTag}>
                                    <SelectTrigger id="official-tag">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Education">Education</SelectItem>
                                        <SelectItem value="Market Warning">Market Warning</SelectItem>
                                        <SelectItem value="Feature Update">Feature Update</SelectItem>
                                        <SelectItem value="New Video">New Video</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="official-bullets">Bullets (1 per line, max 3)</Label>
                                <Textarea id="official-bullets" value={newOfficialBullets} onChange={e => setNewOfficialBullets(e.target.value)} placeholder="• First point...&#x0a;• Second point..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setIsCreateOfficialOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateOfficialPostClick}>Create Post</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>


                <ArjunHighlightsStrip
                  arjunRecos={arjunRecos}
                  posts={posts}
                  onPostClick={onPostClick}
                  userProfile={userProfile}
                  personaRecommendedPostIds={personaRecommendedPostIds}
                />

                <Card className="bg-muted/30 border-border/50">
                    <CardContent className="p-4 flex flex-wrap items-center gap-x-6 gap-y-3">
                        <div className="flex items-center gap-2">
                            <Label htmlFor="sort-by" className="text-sm font-medium">Feed</Label>
                            <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
                                <SelectTrigger id="sort-by" className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="newest">Newest</SelectItem>
                                    <SelectItem value="mostHelpful">Most Helpful</SelectItem>
                                    <SelectItem value="arjunPicks">Arjun Picks</SelectItem>
                                    <SelectItem value="following">Following</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="high-signal" checked={highSignalOnly} onCheckedChange={setHighSignalOnly} />
                            <Label htmlFor="high-signal" className="text-sm font-medium">High-signal only</Label>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {postsToRender.slice(0, visibleCount).map(post => (
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            likes={likesMap[post.id] || 0}
                            comments={commentsMap[post.id] || []}
                            isArjunRecommended={(arjunRecos.recommendedPostIds.includes(post.id) || (personaRecommendedPostIds || []).includes(post.id))}
                            recommendationReason={
                                arjunRecos.recommendedPostIds.includes(post.id) 
                                ? arjunRecos.reason 
                                : (personaRecommendedPostIds || []).includes(post.id) 
                                ? `Recommended based on your '${userProfile.persona}' persona.`
                                : undefined
                            }
                            isHidden={hiddenPostIds.includes(post.id)}
                            isAdmin={isAdmin}
                            onLike={onLike} 
                            onSave={onSave}
                            onDiscuss={handleDiscuss}
                            onAddComment={onAddComment}
                            onReport={onReport}
                            onHide={onHidePost}
                            onDelete={onDeletePost}
                            onMarkAsOfficial={onMarkAsOfficial}
                            userProfile={userProfile}
                            onUpdatePost={onUpdatePost}
                        />
                    ))}

                    {visibleCount < postsToRender.length && (
                        <div className="mt-8 text-center">
                            <Button variant="outline" onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}>
                                Load More ({postsToRender.length - visibleCount} remaining)
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-24">
                {isAdmin && (
                    <AdminToolsCard
                        showFlaggedOnly={showFlaggedOnly}
                        onToggleFlaggedOnly={setShowFlaggedOnly}
                        flaggedCount={posts.filter(p => p.isFlagged).length}
                        hiddenCount={hiddenPostIds.length}
                    />
                )}
                 <Card ref={createPostRef} className="bg-muted/30 border-border/50 scroll-mt-24">
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

                            <Textarea
                                placeholder={newPostCategory === 'Reflection' ? reflectionPlaceholder : "What did you learn today?"}
                                value={newPostContent}
                                onChange={(e) => setNewPostContent(e.target.value)}
                                className={cn(postError && "border-destructive focus-visible:ring-destructive", "min-h-[150px]")}
                            />
                            
                            {postError && (
                                <p className="text-sm text-destructive mt-2 flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                    <span>{postError}</span>
                                </p>
                            )}

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
                                    <Button type="button" variant="ghost" onClick={handleSaveDraft} disabled={!newPostContent.trim()}>Save draft</Button>
                                    <Button onClick={handleCreatePost} disabled={newPostCategory === 'Chart' && !isChartConfirmed}>Post</Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-muted/30 border-border/50">
                    <CardHeader>
                        <CardTitle>Filters</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 flex flex-col gap-4">
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
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function Trophy(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
            <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16" />
            <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    )
}


function LearningStreakCard({ watchedIds }: { watchedIds: string[] }) {
    const streak = useMemo(() => {
        // This is a mock streak. A real implementation would check dates.
        if (watchedIds.length === 0) return 0;
        return (watchedIds.length % 5) + 1;
    }, [watchedIds]);

    return (
        <Card className="bg-muted/30 border-border/50 h-full">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-amber-400" />
                    Learning Streak
                </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-5xl font-bold font-mono text-foreground">{streak}</p>
                <p className="text-sm text-muted-foreground">day streak</p>
                <p className="text-xs text-muted-foreground mt-2">Keep it up! Consistency is key to building good habits.</p>
            </CardContent>
        </Card>
    );
}

function ArjunQueue({ arjunRecos, videosData, onVideoClick }: { arjunRecos: ArjunRecommendations | null, videosData: CommunityState['videos'], onVideoClick: (videoId: string) => void }) {
    const recommendedVideo = useMemo(() => {
        if (!arjunRecos?.recommendedVideoId || !videosData) return null;
        return videosData.playlists.flatMap(p => p.videos).find(v => v.id === arjunRecos.recommendedVideoId);
    }, [videosData, arjunRecos]);
    
    const videoThumbnail = PlaceHolderImages.find(p => p.id === 'video-thumbnail');

    if (!recommendedVideo) {
        return (
            <Card className="bg-muted/30 border-border/50">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Arjun Queue</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-center text-muted-foreground text-sm py-4">
                        Complete onboarding + journal to personalize your queue.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="bg-muted/30 border-primary/20">
            <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /> Arjun Queue</CardTitle>
                <CardDescription>A lesson prioritized for you: {arjunRecos?.reason}</CardDescription>
            </CardHeader>
            <CardContent>
                <div key={recommendedVideo.id} className="group cursor-pointer p-1 rounded-lg" onClick={() => onVideoClick(recommendedVideo.id)}>
                    <div className="grid md:grid-cols-3 gap-4 items-center">
                        <div className="md:col-span-1 aspect-video bg-muted rounded-md relative overflow-hidden">
                            {videoThumbnail && <Image src={videoThumbnail.imageUrl} alt={recommendedVideo.title} fill style={{ objectFit: 'cover' }} data-ai-hint={videoThumbnail.imageHint || 'video thumbnail'} />}
                            <Badge className="absolute bottom-2 right-2 bg-black/50 text-white">{recommendedVideo.duration}</Badge>
                        </div>
                        <div className="md:col-span-2">
                            <p className="font-medium text-lg mt-2 text-foreground group-hover:text-primary transition-colors">{recommendedVideo.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">{recommendedVideo.description}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function LearnTab({ videosData, onVideoClick, arjunRecos }: { videosData: CommunityState['videos'], onVideoClick: (videoId: string) => void, arjunRecos: ArjunRecommendations | null }) {
    const videoThumbnail = PlaceHolderImages.find(p => p.id === 'video-thumbnail');
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    const [watchedIds, setWatchedIds] = useState<string[]>([]);
    
    useEffect(() => {
        try {
            const stored = localStorage.getItem(WATCHED_VIDEOS_KEY);
            if (stored) {
                setWatchedIds(JSON.parse(stored));
            }
        } catch(e) {
            console.error("Failed to parse watched videos", e);
        }
    }, []);

    const handleWatchVideo = (videoId: string) => {
        if (!watchedIds.includes(videoId)) {
            const newIds = [...watchedIds, videoId];
            setWatchedIds(newIds);
            localStorage.setItem(WATCHED_VIDEOS_KEY, JSON.stringify(newIds));
        }
        onVideoClick(videoId);
    }

    const showArjunBanner = !!searchParams.get('video');

    const handleClearBanner = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('video');
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }

    const { featured: featuredVideo, playlists } = videosData;

    return (
        <div className="max-w-5xl mx-auto space-y-12">
            {showArjunBanner && (
                <Alert className="bg-primary/10 border-primary/20 text-foreground">
                    <BrainCircuit className="h-4 w-4 text-primary" />
                    <div className="flex items-center justify-between">
                        <div>
                            <AlertTitle className="text-primary">Arjun Recommended This Lesson</AlertTitle>
                            <AlertDescription>This video may help with patterns Arjun has noticed in your recent trading.</AlertDescription>
                        </div>
                        <Button variant="ghost" size="sm" onClick={handleClearBanner}>Clear</Button>
                    </div>
                </Alert>
            )}
             <ArjunQueue arjunRecos={arjunRecos} videosData={videosData} onVideoClick={handleWatchVideo} />
             <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <Card className="bg-muted/30 border-border/50 h-full">
                        <CardHeader>
                            <CardTitle>{featuredVideo.title}</CardTitle>
                            <CardDescription>{featuredVideo.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative group cursor-pointer overflow-hidden" onClick={() => handleWatchVideo('featured-video')}>
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
                </div>
                <div className="lg:col-span-1">
                    <LearningStreakCard watchedIds={watchedIds} />
                </div>
            </div>

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
                                    <div key={video.id} id={`video-${video.id}`} className="group cursor-pointer p-1 rounded-lg" onClick={() => handleWatchVideo(video.id)}>
                                        <div className="aspect-video bg-muted rounded-md relative overflow-hidden">
                                            {videoThumbnail && <Image src={videoThumbnail.imageUrl} alt={video.title} fill style={{ objectFit: 'cover' }} data-ai-hint={videoThumbnail.imageHint} />}
                                            <Badge className="absolute bottom-2 right-2 bg-black/50 text-white">{video.duration}</Badge>
                                            {watchedIds.includes(video.id) && (
                                                <div className="absolute inset-0 bg-background/70 flex items-center justify-center backdrop-blur-sm">
                                                    <CheckCircle className="h-10 w-10 text-primary" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="font-medium text-sm mt-2 text-foreground group-hover:text-primary transition-colors">{video.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{video.description}</p>
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

function LeadersTab({ posts, likesMap, savesMap, commentsMap, followedUsers, onToggleFollow }: { posts: Post[], likesMap: Record<string, number>, savesMap: Record<string, number>, commentsMap: Record<string, { author: string; text: string }[]>, followedUsers: string[], onToggleFollow: (username: string) => void }) {
    const leaders = useMemo(() => {
        const leaderAuthors: Record<string, { name: string, avatar: string }> = {};
        posts.forEach(post => {
            if (post.author.role === 'Leader') {
                leaderAuthors[post.author.name] = { name: post.author.name, avatar: post.author.avatar };
            }
        });

        const leaderStats = Object.values(leaderAuthors).map(author => {
            const leaderPosts = posts.filter(p => p.author.name === author.name);
            
            const likesReceived = leaderPosts.reduce((sum, post) => sum + (likesMap[post.id] || 0), 0);
            const savesReceived = leaderPosts.reduce((sum, post) => sum + (savesMap[post.id] || 0), 0);
            const commentsReceived = leaderPosts.reduce((sum, post) => sum + (commentsMap[post.id]?.length || 0), 0);
            const highSignalPosts = leaderPosts.filter(p => p.isHighSignal).length;

            const helpfulScore = (likesReceived * 1) + (savesReceived * 2) + (commentsReceived * 1) + (highSignalPosts * 3);

            return {
                name: author.name,
                avatar: author.avatar,
                score: helpfulScore,
                tags: ["Risk Discipline", "Journaling"] // Mock tags
            };
        });

        return leaderStats.sort((a, b) => b.score - a.score);

    }, [posts, likesMap, savesMap, commentsMap]);

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
                    <Card key={leader.name} id={`leader-${leader.name.replace(/\s+/g, '-')}`} className="bg-muted/30">
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
                            <Button variant="outline" className="w-full" onClick={() => onToggleFollow(leader.name)}>
                                <User className="mr-2 h-4 w-4" />
                                {followedUsers.includes(leader.name) ? 'Unfollow' : 'Follow'}
                            </Button>
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

const getPersonaRecommendations = (posts: Post[], personaName: string): string[] => {
    const personaKeywords: Record<string, string[]> = {
        'Fearful Analyst': ['fear', 'hesitation', 'holding discipline', 'patience'],
        'Impulsive Sprinter': ['max trades', 'cooldown', 'revenge trading', 'checklist', 'overtrading', 'impulse'],
        'Overconfident': ['leverage', 'risk', 'humility', 'respect', 'stop loss', 'sl'],
        'Beginner': ['basic structure', 'r:r', 'stop loss', 'sl placement', 'journaling'],
    };

    const keywords = personaKeywords[personaName] || personaKeywords['Beginner'];
    if (!keywords) return [];

    const recommendedPosts: { id: string; score: number }[] = [];

    posts.forEach(post => {
        let score = 0;
        const postText = (post.content || '').toLowerCase();
        
        keywords.forEach(keyword => {
            if (postText.includes(keyword)) {
                score++;
            }
        });

        if (score > 0) {
            recommendedPosts.push({ id: post.id, score });
        }
    });

    // Sort by score and return top 3 post IDs
    return recommendedPosts
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(p => p.id);
};

const calculatePostQualityScore = (postData: Omit<Post, 'id' | 'timestamp' | 'author' | 'isHighSignal'>): number => {
    let score = 0;
    const { type, content } = postData;

    // Category weight
    if (type === 'Reflection' || type === 'Insight') {
        score += 30;
    } else {
        score += 10;
    }

    // Text length
    const len = content.length;
    if (len >= 20 && len <= 600) {
        score += 30;
    } else if (len > 600) {
        score += 10; // Still valuable but might be too long
    }

    // Keyword presence
    const lessonKeywords = ['lesson', 'learned', 'realized', 'understand', 'mistake', 'realisation'];
    if (lessonKeywords.some(kw => content.toLowerCase().includes(kw))) {
        score += 25;
    }

    // Forbidden patterns (already handled partially in submit logic)
    const signalKeywords = ["entry", "target", "buy now", "sell now", "guaranteed", "pump", "dump", "moon", "signal", "sl at", "tp at"];
    if (signalKeywords.some(kw => content.toLowerCase().includes(kw))) {
        score -= 50;
    }
    
    // Links
    const linkPattern = /(http|https|www\.)/i;
    if (linkPattern.test(content)) {
        score = 0;
    }

    return Math.max(0, Math.min(100, score));
};

function ReportDialog({ isOpen, onOpenChange, onSubmit }: { isOpen: boolean; onOpenChange: (open: boolean) => void; onSubmit: (reason: string) => void; }) {
    const [reason, setReason] = useState('');
    const reportReasons = [
        "Spam or promotion",
        "Signals / financial advice",
        "Profanity or hate speech",
        "Other",
    ];

    const handleSubmit = () => {
        if (reason) {
            onSubmit(reason);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Report Content</DialogTitle>
                    <DialogDescription>
                        Why are you reporting this content? Your report is anonymous.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <RadioGroup value={reason} onValueChange={setReason} className="space-y-2">
                        {reportReasons.map(r => (
                            <div key={r} className="flex items-center space-x-2">
                                <RadioGroupItem value={r} id={r} />
                                <Label htmlFor={r}>{r}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!reason}>Submit Report</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export function CommunityModule({ onSetModule, context }: CommunityModuleProps) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const createPostRef = useRef<HTMLDivElement>(null);

    const [communityState, setCommunityState] = useState<CommunityState | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [arjunRecos, setArjunRecos] = useState<ArjunRecommendations | null>(null);
    const [followedUsers, setFollowedUsers] = useState<string[]>([]);
    
    const [reportDialogOpen, setReportDialogOpen] = useState(false);
    const [itemToReport, setItemToReport] = useState<{ id: string, type: 'post' | 'comment' } | null>(null);

    const [activeTab, setActiveTab] = useState('feed');
    const [highlightedItem, setHighlightedItem] = useState<string|null>(null);
    const [showVideoModal, setShowVideoModal] = useState(false);
    const [clickedVideoId, setClickedVideoId] = useState<string | null>(null);

    const [isAdmin, setIsAdmin] = useState(false);
    const [hiddenPostIds, setHiddenPostIds] = useState<string[]>([]);

    const handleTabChange = (tab: string) => {
        const params = new URLSearchParams();
        params.set('tab', tab);
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    useEffect(() => {
        if (context?.openCreatePost === 'Reflection') {
            setActiveTab('feed');
            // Allow time for tab content to render before scrolling
            setTimeout(() => createPostRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        }
    }, [context]);

    // Data loading and initialization
    useEffect(() => {
        try {
            const communityStateRaw = localStorage.getItem(COMMUNITY_STATE_KEY);
            const userProfileRaw = localStorage.getItem(USER_PROFILE_KEY);
            const arjunRecosRaw = localStorage.getItem(ARJUN_RECO_KEY);
            const followedUsersRaw = localStorage.getItem(FOLLOWED_USERS_KEY);
            const hiddenIdsRaw = localStorage.getItem(HIDDEN_POSTS_KEY);

            let finalCommunityState: CommunityState;
            let finalUserProfile: UserProfile;
            
            if (communityStateRaw) {
                finalCommunityState = { ...initialCommunityState, ...JSON.parse(communityStateRaw) };
            } else {
                finalCommunityState = initialCommunityState;
            }

            if (userProfileRaw) {
                finalUserProfile = JSON.parse(userProfileRaw);
                if (finalUserProfile.role === 'Admin') {
                    setIsAdmin(true);
                }
            } else {
                finalUserProfile = initialUserProfile;
            }

            if (hiddenIdsRaw) {
                setHiddenPostIds(JSON.parse(hiddenIdsRaw));
            }

            const personaName = finalUserProfile.persona || 'Beginner';
            const personaRecommendedIds = getPersonaRecommendations(finalCommunityState.posts, personaName);
            finalCommunityState.personaRecommendedPostIds = personaRecommendedIds;
            
            setCommunityState(finalCommunityState);

            if (arjunRecosRaw) {
                setArjunRecos(JSON.parse(arjunRecosRaw));
            } else {
                localStorage.setItem(ARJUN_RECO_KEY, JSON.stringify(initialArjunRecos));
                setArjunRecos(initialArjunRecos);
            }

            if (followedUsersRaw) {
                setFollowedUsers(JSON.parse(followedUsersRaw));
            }
            
            setUserProfile(finalUserProfile);

            if (!communityStateRaw) {
                localStorage.setItem(COMMUNITY_STATE_KEY, JSON.stringify(finalCommunityState));
            }
            if (!userProfileRaw) {
                localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(finalUserProfile));
            }

        } catch (e) {
            console.error("Error loading community data from localStorage", e);
            setCommunityState(initialCommunityState);
            setUserProfile(initialUserProfile);
            setArjunRecos(initialArjunRecos);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const checkAndPromoteToLeader = useCallback(() => {
        if (!userProfile || !communityState || userProfile.role === 'Leader') {
            return;
        }

        const userPosts = communityState.posts.filter(p => p.author.name === userProfile.username);
        
        const postCount = userPosts.length;
        const likesReceived = userPosts.reduce((acc, post) => acc + (communityState.likesMap[post.id] || 0), 0);
        const savesReceived = userPosts.reduce((acc, post) => acc + (communityState.savesMap[post.id] || 0), 0);
        const commentsReceived = userPosts.reduce((acc, post) => acc + (communityState.commentsMap[post.id]?.length || 0), 0);
        const highSignalPosts = userPosts.filter(p => p.isHighSignal).length;

        const isEligible = 
            postCount >= 5 &&
            likesReceived >= 15 &&
            (savesReceived >= 10 || commentsReceived >= 10) &&
            highSignalPosts >= 3;

        if (isEligible) {
            const newUserProfile = { ...userProfile, role: 'Leader' as const };
            setUserProfile(newUserProfile);
            localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newUserProfile));
            toast({
                title: "You’ve been promoted to Leader — keep it disciplined.",
            });
        }
    }, [userProfile, communityState, toast]);

    useEffect(() => {
        checkAndPromoteToLeader();
    }, [communityState, checkAndPromoteToLeader]);


    // URL param handling
    useEffect(() => {
        const tab = searchParams.get('tab') || 'feed';
        const videoId = searchParams.get('video');
        const postId = searchParams.get('post');
        const userId = searchParams.get('user');

        let newTab = tab;
        let itemToHighlight: string | null = null;

        if (videoId) {
            newTab = 'learn';
            itemToHighlight = `video-${videoId}`;
            handleVideoClick(videoId); // Show modal immediately
        } else if (postId) {
            newTab = 'feed';
            itemToHighlight = `post-${postId}`;
        } else if (userId) {
            newTab = 'leaders';
            itemToHighlight = `leader-${userId.replace(/\s+/g, '-')}`;
        }

        if (activeTab !== newTab) {
            setActiveTab(newTab);
        }
        setHighlightedItem(itemToHighlight);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    // Scroll & Highlight effect
    useEffect(() => {
        if (highlightedItem && !isLoading) {
            const element = document.getElementById(highlightedItem);
            if (element) {
                // Wait for tab switch to complete
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('highlight-glow');
                    const timer = setTimeout(() => {
                        element.classList.remove('highlight-glow');
                    }, 3000);
                    
                    // Cleanup URL and state after animation
                    const urlTimer = setTimeout(() => {
                        setHighlightedItem(null);
                        const params = new URLSearchParams(searchParams.toString());
                        params.delete('video');
                        params.delete('post');
                        params.delete('user');
                        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                    }, 3500);

                    return () => {
                        clearTimeout(timer);
                        clearTimeout(urlTimer);
                    };
                }, 100); // Small delay to allow tab content to render
            } else {
                // If element not found after a short delay, clear highlight state
                const checkAgain = setTimeout(() => {
                    const element = document.getElementById(highlightedItem);
                     if (element) {
                        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        element.classList.add('highlight-glow');
                        const timer = setTimeout(() => {
                            element.classList.remove('highlight-glow');
                        }, 3000);
                        const urlTimer = setTimeout(() => {
                            setHighlightedItem(null);
                            const params = new URLSearchParams(searchParams.toString());
                            params.delete('video');
                            params.delete('post');
                            params.delete('user');
                            router.replace(`${pathname}?${params.toString()}`, { scroll: false });
                        }, 3500);
                        return () => { clearTimeout(timer); clearTimeout(urlTimer); };
                     } else {
                        setHighlightedItem(null);
                     }
                }, 500);
                return () => clearTimeout(checkAgain);
            }
        }
    }, [highlightedItem, isLoading, pathname, router, searchParams]);

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
    
    const handleSave = (postId: string) => {
        updateCommunityState(prev => ({
            ...prev,
            savesMap: {
                ...prev.savesMap,
                [postId]: (prev.savesMap[postId] || 0) + 1,
            }
        }));
    };

    const handleCreatePost = (newPostData: Omit<Post, 'id' | 'timestamp' | 'author' | 'isHighSignal'>) => {
        if (!userProfile) return;
        const qualityScore = calculatePostQualityScore(newPostData);
        const newPost: Post = {
            ...newPostData,
            id: String(Date.now()),
            timestamp: new Date().toISOString(),
            author: { name: userProfile.username, avatar: "/avatars/user.png", role: userProfile.role },
            isHighSignal: qualityScore > 75,
        };
        updateCommunityState(prev => ({
            ...prev,
            posts: [newPost, ...prev.posts]
        }));
    };
    
    const handleUpdatePost = (postId: string, newContent: string) => {
        updateCommunityState(prev => {
            if (!prev) return null;
            const now = new Date();
            const postToUpdate = prev.posts.find(p => p.id === postId);

            if (!postToUpdate || (userProfile?.username !== postToUpdate.author.name)) {
                toast({ variant: 'destructive', title: "Not authorized" });
                return prev;
            }

            const postDate = new Date(postToUpdate.timestamp);
            const diffInMinutes = (now.getTime() - postDate.getTime()) / (1000 * 60);

            if (diffInMinutes > 10) {
                 toast({ variant: 'destructive', title: "Edit window expired", description: "You can only edit posts for 10 minutes." });
                 return prev;
            }

            const updatedPosts = prev.posts.map(p =>
                p.id === postId ? { ...p, content: newContent, editedAt: now.toISOString() } : p
            );
            return { ...prev, posts: updatedPosts };
        });
        toast({ title: "Post updated successfully" });
    };

    const handleCreateOfficialPost = (post: Omit<OfficialPost, 'icon'>) => {
        updateCommunityState(prev => ({
            ...prev,
            officialPosts: [post, ...prev.officialPosts]
        }));
        toast({ title: "Official post created." });
    };

    const handleAddComment = (postId: string, commentText: string) => {
        if (!userProfile) return;
        updateCommunityState(prev => {
            const postComments = prev.commentsMap[postId] || [];
            const newComment = { author: userProfile.username, text: commentText };
            return {
                ...prev,
                commentsMap: {
                    ...prev.commentsMap,
                    [postId]: [...postComments, newComment]
                }
            };
        });
    };

    const handleToggleFollow = (username: string) => {
        setFollowedUsers(prev => {
            const newUsers = prev.includes(username)
                ? prev.filter(u => u !== username)
                : [...prev, username];
            localStorage.setItem(FOLLOWED_USERS_KEY, JSON.stringify(newUsers));
            toast({
                title: newUsers.includes(username) ? `Following ${username}` : `Unfollowed ${username}`
            });
            return newUsers;
        });
    };

    const handleVideoClick = (videoId: string) => {
        setClickedVideoId(videoId);
        setShowVideoModal(true);
    };
    
    const handlePostClick = (postId: string) => {
        const params = new URLSearchParams();
        params.set('tab', 'feed');
        params.set('post', postId);
        router.push(`${pathname}?${params.toString()}`);
    };

    const handleOpenReportDialog = (id: string, type: 'post' | 'comment') => {
        setItemToReport({ id, type });
        setReportDialogOpen(true);
    };
    
    const handleReportSubmit = (reason: string) => {
        if (!itemToReport) return;
        
        const newReport = {
            itemId: itemToReport.id,
            itemType: itemToReport.type,
            reason,
            timestamp: new Date().toISOString(),
        };

        const reports = JSON.parse(localStorage.getItem('ec_community_reports') || '[]');
        reports.push(newReport);
        localStorage.setItem('ec_community_reports', JSON.stringify(reports));

        toast({
            title: "Report Submitted",
            description: "Thank you. Our team will review this shortly.",
        });

        setReportDialogOpen(false);
        setItemToReport(null);
    };

    const handleHidePost = (postId: string) => {
        const newHiddenIds = hiddenPostIds.includes(postId)
            ? hiddenPostIds.filter(id => id !== postId)
            : [...hiddenPostIds, postId];
        setHiddenPostIds(newHiddenIds);
        localStorage.setItem(HIDDEN_POSTS_KEY, JSON.stringify(newHiddenIds));
        toast({ title: `Post ${newHiddenIds.includes(postId) ? 'hidden' : 'made visible'}` });
    };

    const handleDeletePost = (postId: string) => {
        updateCommunityState(prev => ({
            ...prev,
            posts: prev.posts.filter(p => p.id !== postId)
        }));
        toast({ title: "Post permanently deleted" });
    };

    const handleMarkAsOfficial = (post: Post) => {
        const newOfficialPost = {
            title: post.content.split('\n')[0].substring(0, 50),
            bullets: post.content.split('\n').slice(1),
            tag: "Community Insight"
        };
        updateCommunityState(prev => ({
            ...prev,
            posts: prev.posts.filter(p => p.id !== post.id),
            officialPosts: [newOfficialPost, ...prev.officialPosts]
        }));
        toast({ title: "Post marked as official" });
    };

    if (isLoading || !communityState || !userProfile || !arjunRecos) {
        return <div>Loading...</div>; // Or a skeleton loader
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-foreground">Community — Discipline & Learning</h1>
                    <p className="text-muted-foreground">High-signal reflections, charts, and insights. No signals. No hype.</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => createPostRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Create Post
                    </Button>
                </div>
            </div>
            
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
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
                        savesMap={communityState.savesMap}
                        arjunRecos={arjunRecos}
                        userProfile={userProfile}
                        onSetModule={onSetModule}
                        onLike={handleLike}
                        onSave={handleSave}
                        onCreatePost={handleCreatePost}
                        onCreateOfficialPost={handleCreateOfficialPost}
                        videosData={communityState.videos}
                        onPostClick={handlePostClick}
                        onVideoClick={handleVideoClick}
                        personaRecommendedPostIds={communityState.personaRecommendedPostIds || []}
                        onAddComment={handleAddComment}
                        followedUsers={followedUsers}
                        createPostRef={createPostRef}
                        initialCategory={context?.openCreatePost}
                        onReport={handleOpenReportDialog}
                        isAdmin={isAdmin}
                        hiddenPostIds={hiddenPostIds}
                        onHidePost={handleHidePost}
                        onDeletePost={handleDeletePost}
                        onMarkAsOfficial={handleMarkAsOfficial}
                        onUpdatePost={handleUpdatePost}
                    />
                </TabsContent>
                <TabsContent value="learn" className="mt-8">
                    <LearnTab 
                        videosData={communityState.videos}
                        onVideoClick={handleVideoClick}
                        arjunRecos={arjunRecos}
                    />
                </TabsContent>
                <TabsContent value="leaders" className="mt-8">
                    <LeadersTab 
                        posts={communityState.posts} 
                        likesMap={communityState.likesMap} 
                        savesMap={communityState.savesMap}
                        commentsMap={communityState.commentsMap}
                        followedUsers={followedUsers}
                        onToggleFollow={handleToggleFollow}
                    />
                </TabsContent>
            </Tabs>
             <AlertDialog open={showVideoModal} onOpenChange={setShowVideoModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Prototype Video</AlertDialogTitle>
                        <AlertDialogDescription>
                            This is a prototype. In the live product, this would play the real explainer video for video ID: {clickedVideoId}.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction onClick={() => setShowVideoModal(false)}>Close</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <ReportDialog 
                isOpen={reportDialogOpen} 
                onOpenChange={setReportDialogOpen}
                onSubmit={handleReportSubmit} 
            />
        </div>
    );
}

