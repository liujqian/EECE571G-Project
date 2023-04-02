export interface GameResponse {
    id: number;
    card_price: string;
    has_completed: boolean;
    host_address: string;
    host_fee: string;
    is_valid: boolean;
    last_draw_time: string;
    pool_value: string;
    start_time: string;
    turn_time: string;
}

export interface TransactionParameters {
    to: string;
    from: string;
    data: Promise<any>;
}

export interface CardInfo {
    gameId: number;
    card: number[];
    value: string;
}
