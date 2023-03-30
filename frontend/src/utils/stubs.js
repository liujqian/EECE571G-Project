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

export async function getTotalGameCount() {
    return 15;
}

export async function getGameInfo(gameID) {
    return {
        hostAddress: "0xB8B97b070C78c9dfc6a6BA03DfCA805E676BF725",
        cardPrice: 1,
        startTime: 2680145533,
        hostFee: 0,
        turnTime: 600,
        hasCompleted: false,
        poolValue: 10002,
        numbersDrawn: [0, 8, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100]
    }
}

export async function getCards(gamerAddress, gameID) {
    return [
        [1, 2, 3, 4, 5, 21, 22, 23, 24, 25, 41, 42, 0, 44, 45, 61, 62, 64, 63, 65, 85, 81, 82, 93, 84],
        [9, 8, 7, 6, 5, 21, 22, 23, 24, 25, 41, 42, 0, 44, 45, 61, 62, 64, 63, 65, 85, 81, 82, 93, 84],
        [8, 9, 7, 6, 5, 21, 22, 23, 24, 25, 41, 42, 0, 44, 45, 61, 62, 64, 63, 65, 85, 81, 82, 93, 84],
    ]
}