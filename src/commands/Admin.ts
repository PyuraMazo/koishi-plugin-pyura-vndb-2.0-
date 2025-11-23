import { Command, Context } from 'koishi'
import { QueueManager } from '../components/Queue'

export function apply(ctx: Context, main: Command<never, never, string[], {}>) {
    main
        .subcommand('.queue')
        .alias('queue')
        .action(async ({ session }) => {
            const manager = QueueManager.getInstance();
            session.send(manager.checkMap(session));
        })
}