export interface PhotoMetadata {
    id: string;
    fileName: string;
    caption?: string;
    action: 'add' | 'update' | 'delete'
}

export interface HikeSearchParams {
    page: number;
    pageSize: number;
    startDate?: Date;
    endDate?: Date;
    searchText?: string;
}
