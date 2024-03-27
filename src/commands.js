import SayCommand from "#root/commands/say.js";
import ReplyCommand from "#root/commands/reply.js";
import StatusCommand from "#root/commands/status.js";
import SlowmodeCommand from "#root/commands/slowmode.js";
import IsolateCommand from "#root/commands/isolate.js";
import AttachmentsCommand from "#root/commands/attachments.js";
import isPlainObject from "is-plain-obj";

const commands = {
  [SayCommand.spec.name]: SayCommand,
  [ReplyCommand.spec.name]: ReplyCommand,
  [StatusCommand.spec.name]: StatusCommand,
  [SlowmodeCommand.spec.name]: SlowmodeCommand,
  [IsolateCommand.spec.name]: IsolateCommand,
  [AttachmentsCommand.spec.name]: AttachmentsCommand,
};

export default commands;
export function makePayload() {
  return Object.values(commands).map(c => {
    if (c.spec === undefined || c.handle === undefined || !(c.handle instanceof Function)) {
      throw new Error(`Malformed command ${JSON.stringify(c)}`);
    }
    if (!isPlainObject(c.spec)) {
      throw new Error(
        `Command spec ${JSON.stringify(c)} is not ready to upload - did you remember to call .toJson()?`
      );
    }
    return c.spec;
  });
}
