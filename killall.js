/** @param {NS} ns **/
export async function main(ns) {
    for (let server of ((ns.read("servers.txt").split(",")).concat(ns.getPurchasedServers())).concat(["home"])){
        ns.killall(server)
    }
}