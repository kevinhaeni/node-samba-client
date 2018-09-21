export interface SmbConfig {
    address: string;
    username?: string;
    password?: string;
    domain?: string;
    path?: string;
    others?: string;
}

export class SambaClient {
    constructor(config: SmbConfig);
    public getFile(path: string, destination: string, cb: Function): any;
    public sendFile (path: string, destination: string, cb: Function): any;  
    public deleteFile(fileName: string, cb:Function): any;
    public listFiles (fileNamePrefix:string , fileNameSuffix: string, cb:Function): any;
    public mkdir (remotePath:string, cb:Function):any;
    public fileExists(remotePath:string, cb:Function): any;
}