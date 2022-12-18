export interface PhotoMetadata {
    id: string;
    fileName: string;
    caption?: string;
    action: 'add' | 'update' | 'delete'
}

export interface HikeSearchParams {
    startDate?: Date;
    endDate?: Date;
    searchText?: string;
}
