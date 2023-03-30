export function getNumCards() {
    return 6;
}

export function generateRandomCard() {
    let card = [];
    let cardMap = {};
    let max = 100;
    for (let i = 0; i < 5; i++) {
        let row = [];
        for (let j = 0; j < 5; j++) {
            let rand = Math.floor(Math.random() * max);
            while (rand in cardMap) {
                rand = Math.floor(Math.random() * max);
            }
            cardMap[rand] = true;
            row.push(rand);
        }
        card.push(row);
    }
    return card;
}

export async function getTotalGameCount(){
    return 15;
}