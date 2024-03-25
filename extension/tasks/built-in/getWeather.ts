import { Task } from "../task.js";

const getWeather = `async function getWeather(tab: Tab, location: string): Promise<string> {
    await tab.navigateTo("https://www.google.com");

    await tab.findElement("Search", "type");
    await tab.sendKeysToElement("weather of " + location, Key.ENTER);

    const weatherData = await tab.findInText("Weather in " + location);
    return weatherData;
}`;

Task.fromCode(getWeather).save(/*ignoreExisting =*/ true);