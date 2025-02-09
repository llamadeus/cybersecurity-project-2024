import { globals } from "$lib/globals";
import { openDB } from "$lib/keyval";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";


dayjs.extend(relativeTime);

openDB().then((store) => {
  globals.setKeyValStore(store);
});
