import { Task } from "../task.js";

const sendEmailGmail = `async function sendEmailGmail(tab: Tab, to: string, subject: string, body: string): Promise<void> {
    await tab.navigateTo('https://mail.google.com')
    await tab.sleep(1000);

    await tab.findElement('Compose', "click")
    await tab.clickElement()
    await tab.sleep(1000);
   
    await tab.findElement('To input bar', "type")
    await tab.sendKeysToElement(to)
    await tab.sleep(1000);
   
    await tab.findElement('Subject', "type")
    await tab.sendKeysToElement(subject)
    await tab.sleep(1000);
    
    await tab.findElement('Message body', "type")
    await tab.sendKeysToElement(body)
    await tab.sleep(1000);

    await tab.findElement('Send', "click")
    await tab.clickElement()
}`

Task.fromCode(sendEmailGmail).save(/*ignoreExisting =*/ true);