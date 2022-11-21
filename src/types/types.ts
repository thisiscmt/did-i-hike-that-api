export interface PhotoMaintanance {
    id: string;
    fileName: string;
    action: 'add' | 'update' | 'delete'
}
