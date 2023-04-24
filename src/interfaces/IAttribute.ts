


export interface IAttribute {
    name: string;
    value: string;
    type: string;
}

export interface INodeDocumentation {
    [key: string]: IAttribute[];
}

