export interface PhotoMetadata {
    id: string;
    fileName: string;
    ordinal: number;
    caption?: string;
    action: 'add' | 'update' | 'delete'
}

export interface HikeSearchParams {
    userName: string;
    userId: string;
    page: number;
    pageSize: number;
    startDate?: string;
    endDate?: string;
    searchText?: string;
}

export interface LoginResult {
    success: boolean;
    fullName: string;
    email: string;
    role: string;
    userId: string;
}
