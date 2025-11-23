import { Command, Context } from 'koishi'
import { Queue, QueueElement } from '../components/Queue'
import { cmdType } from './Index'
import { ProcessManager } from "../components/ProcessManager";

export function apply(ctx: Context, main: Command<never, never, string[], {}>) {
    main
        .subcommand('.id <string:text>')
        .alias('vndb.i', 'id')
        .action(async ({ session }, keyword) => {
            let type: cmdType;
            if (keyword[0] === 'v') {
                type = cmdType.VN;
            } else if (keyword[0] === 'c') {
                type = cmdType.Character;
            } else if (keyword[0] === 'p') {
                type = cmdType.Producer;
            } else {
                session.send(`id「${keyword}」无法匹配当前所支持的类型或者有误！`);
                return;
            }

            const queue = new Queue(ctx, session);
            const node: QueueElement = {
                type: type,
                value: keyword,
                running: false,
                method: 'id'
            }

            queue.enQueue(node);

            new ProcessManager(ctx, session, queue).startListening();
        })
}