import { Command, Context } from 'koishi'
import { Queue, QueueElement } from '../components/Queue'
import { cmdType } from './Index'
import { ProcessManager } from "../components/ProcessManager";

export function apply(ctx: Context, main: Command<never, never, string[], {}>) {
    main
        .subcommand('.character <keyword:text>')
        .alias('vndb.c', 'character')
        .action(async ({ session }, keyword) => {
            const queue = new Queue(ctx, session);
            const node: QueueElement = {
                type: cmdType.Character,
                value: keyword,
                running: false
            }

            queue.enQueue(node);

            new ProcessManager(ctx, session, queue).startListening();
        })
}