export interface PhotoMetadata {
    id: string;
    fileName: string;
    caption?: string;
    action: 'add' | 'update' | 'delete'
}
