export type Millennium = {
	callServerMethod: (methodName: string, kwargs?: any) => Promise<any>;
	findElement: (privateDocument: Document, querySelector: string, timeOut?: number) => Promise<NodeListOf<Element>>;
};

export interface CSWatchPlayer {
	steam64Id: string;
	name: string;
	steamAvatarUrl: string;
	csWatchStats: {
		kdRatio: number | null;
		totalMatches: number | null;
		winrate: number | null;
		aimRating: number | null;
		reactionTimeMs: number | null;
		preaim: number | null;
	};
}

export interface CSWatchAnalysisBreakdown {
	type: string;
	score: number;
	message: string;
	value: string;
	unit: string;
}

export interface CSWatchAnalysis {
	version: string;
	totalScore: number;
	message: string;
	breakdown: CSWatchAnalysisBreakdown[];
}

export interface CSWatchResponse {
	player: CSWatchPlayer;
	csWatchAnalysis: CSWatchAnalysis;
	totalSuspicionScore: number;
	lastUpdated: string;
}

export interface CSWatchAPIResponse {
	success: boolean;
	data?: CSWatchResponse;
	error?: string;
}
