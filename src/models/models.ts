export interface PhotoMetadata {
    id: string;
    fileName: string;
    ordinal: number;
    caption?: string;
    action: 'add' | 'update' | 'delete'
}

export interface HikeSearchParams {
    page: number;
    pageSize: number;
    startDate?: string;
    endDate?: string;
    searchText?: string;
}
