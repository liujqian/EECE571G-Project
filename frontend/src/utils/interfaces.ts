export interface GameResponse {
    id: number;
    card_price: string;
    has_completed: boolean;
    host_address: string;
    host_fee: string;
    is_valid?: boolean;
    last_draw_time?: string;
    pool_value: string;
    start_time: string;
    turn_time: string;
    drawn_numbers?: Array<number>;
}

export interface GameRequest {
    card_price: string;
    host_fee: string;
    start_time: string;
    turn_time: string;
    value: string;
}

export interface TransactionParameters {
    to: string;
    from: string;
    value?: string;
    data: Promise<any>;
}

export interface CardInfo {
    gameId: number;
    card: number[];
    value: string;
}
