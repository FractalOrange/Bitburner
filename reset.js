/** @param {NS} ns **/
export async function main(ns) {
    ns.run("delayedstartup.js")
    await ns.sleep(500)
    ns.run("killall.js")
}