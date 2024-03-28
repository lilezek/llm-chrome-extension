import { Task } from "../task.js";

const sendEmailGmail = `async function sendEmailGmail(tab: Tab, to: string, subject: string, body: string): Promise<void> {
    await tab.navigateTo('https://mail.google.com')

    const compose = await tab.findElement('Compose', "click")
    await tab.clickElement(compose)
   
    const toElement = await tab.findElement('To input bar', "type")
    await tab.sendKeysToElement(toElement, to)
   
    const subjectElement = await tab.findElement('Subject', "type")
    await tab.sendKeysToElement(subjectElement, subject)
    
    const bodyElement = await tab.findElement('Message body', "type")
    await tab.sendKeysToElement(bodyElement, body)

    const sendButton = await tab.findElement('Send', "click")
    await tab.clickElement(sendButton)
}`;

Task.fromCode(sendEmailGmail).save(/*ignoreExisting =*/ true);