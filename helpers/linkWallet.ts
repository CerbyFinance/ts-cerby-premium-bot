import { getUser, getUsersByWallet } from "../database/user";
import { disconnectWallet } from "./disconnectWallet";

export async function linkWallet(id, address, signature, signMessage) {
    const user = await getUser(id);
    if(!user) {
        throw "User not found";
    }
    user.address = address;
    user.signature = signature;
    user.signMessage = signMessage;
    await user.save(); // We save the user, then we will go through all to exclude the attack method of the race condition

    const usersByWallet = await getUsersByWallet(address);
    usersByWallet.map(async (userByWallet) => {
        if(userByWallet.id != user.id) {
            await disconnectWallet(userByWallet.id, "Your wallet has been linked by another user.");
        }
    });
}