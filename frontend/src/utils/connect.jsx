const Web3 = require("web3");
const infuraKey = process.env.REACT_APP_INFURA_KEY;
const web3 = new Web3("https://polygon-mumbai.infura.io/v3/" + infuraKey);

export function addWalletListener(callback) {
    window.ethereum.on("accountsChanged", callback);
    window.ethereum.on("disconnect", callback);
}

export function removeWalletListener(callback) {
    window.ethereum.removeListener("accountsChanged", callback);
    window.ethereum.removeListener("disconnect", callback);
}

export function isMetaMaskPresent() {
    if (window.ethereum) {
        return true;
    }
    return false;
}

export const connectWallet = async () => {
    if (window.ethereum) {
        try {
            const addressArray = await window.ethereum.request({
                method: "eth_requestAccounts",
            });
            const obj = {
                status: "👆🏽 input the transfer to addresst in the text-field above.",
                address: addressArray[0],
            };
            return obj;
        } catch (err) {
            return {
                address: "",
                status: "😥 " + err.message,
            };
        }
    } else {
        return {
            address: "",
            status: "window.ethereum is undefined",
        };
    }
};

export const getCurrentWalletConnected = async () => {
    if (window.ethereum) {
        try {
            const addressArray = await window.ethereum.request({
                method: "eth_accounts",
            });
            if (addressArray.length > 0) {
                return {
                    address: addressArray[0],
                    status: "👆Successful.",
                };
            } else {
                return {
                    address: "",
                    status: "🦊 Connect to Metamask.",
                };
            }
        } catch (err) {
            return {
                address: "",
                status: "😥 " + err.message,
            };
        }
    } else {
        return {
            address: "",
            status: "You must install metamask.",
        };
    }
};
