export declare function cd(path: string): void;
export declare function git(args: string): Promise<void>;
export declare function testGit(args: string): Promise<boolean>;
export declare function rmrf(glob: string): Promise<void>;
