// This program figures out when the gang warfare happens, then changes all members to warfare just before the tick, then returns them to their 
// previous work.
export async function main(ns) {

    // Find the first tick for power change
    let power = ns.gang.getGangInformation().power
    while (power == ns.gang.getGangInformation().power) {
        // Make sure at least one member is on warfare so that we pick up on power changes
        ns.gang.setMemberTask(ns.gang.getMemberNames()[0], "Territory Warfare")
        await ns.sleep(10)
    }
    await ns.sleep(19.5 * 1000)

    // Sometimes the loop gets stuck, so we reset it every 30 minutes. The other gangs script
    // will automatically re-start this one.
    for (let i = 0; i < 90; i++) {
        let members = ns.gang.getMemberNames()
        let memberTasks = []

        // Find the current tasks and set all members to warefare
        for (let i = 0; i < members.length; i++) {
            // Store oldtask as a pair with the member name in it
            memberTasks.push([members[i], ns.gang.getMemberInformation(members[i]).task])
            ns.gang.setMemberTask(members[i], "Territory Warfare")
        }

        // Wait until power changes
        let power = ns.gang.getGangInformation().power
        while (power == ns.gang.getGangInformation().power) {
            await ns.sleep(10)
        }

        // Put all members back to their original task
        for (let member of ns.gang.getMemberNames()) {
            let oldTask = "Train Combat"
            // Need to do this slightly convoluted approach since gang members can die in war
            for (let pair of memberTasks) {
                if (pair[0] == member) {
                    oldTask = pair[1]
                    break
                }
            }
            ns.gang.setMemberTask(member, oldTask)
        }
        
        // Wait until just before the next power tick
        await ns.sleep(19.5 * 1000)
    }
}