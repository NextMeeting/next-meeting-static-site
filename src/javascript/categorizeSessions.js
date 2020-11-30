const ALREADY_STARTED_MEETING_VISIBILITY_THRESHOLD_MINUTES = 50;

const MILLISECONDS_IN_MINUTE = 60 * 1000;
const MILLISECONDS_IN_HOUR = MILLISECONDS_IN_MINUTE * 60;

function categorizeSessions(sessions) {

  const MEETINGS_BY_TIME = {
    past: {
      olderThanThreshold: [],
      newerThanThreshold: [] 
    },
    future: {
      nextHour: [],
      restOfDay: [],
      tomorrow: [],
      thisWeek: [],
      other: []
    }
  }

  const now = new Date();
  const currentTimeString = now.toISOString();

  CURRENT_TIME_STRING = currentTimeString;

  const alreadyStartedOlderThanThresholdTimeString = new Date(now.getTime() - (MILLISECONDS_IN_MINUTE * ALREADY_STARTED_MEETING_VISIBILITY_THRESHOLD_MINUTES)).toISOString();
  const nextHourTimeString = new Date(now.getTime() + MILLISECONDS_IN_HOUR).toISOString();
  
  const nextMidnight = new Date(new Date().setHours(24,0,0,0)) ; 
  const nextMidnightTimeString = nextMidnight.toISOString(); 

  const hoursInWeek = 24 * 7;
  const nextSevenDays = new Date(new Date().setHours(hoursInWeek,0,0,0));
  const thisWeekTimeString = nextSevenDays.toISOString();

  const endOfTomorrowTimeString = new Date(nextMidnight.getTime() + MILLISECONDS_IN_HOUR * 24).toISOString();

  sessions.forEach((session) => {
    if(session.nextOccurrence < alreadyStartedOlderThanThresholdTimeString) {
      MEETINGS_BY_TIME.past.olderThanThreshold.push(session);
      return;
    }
    if(session.nextOccurrence < currentTimeString) {
      MEETINGS_BY_TIME.past.newerThanThreshold.push(session);
      return;
    }
    if(session.nextOccurrence < nextHourTimeString) {
      MEETINGS_BY_TIME.future.nextHour.push(session);
      return;
    }
    if(session.nextOccurrence < nextMidnightTimeString) {
      MEETINGS_BY_TIME.future.restOfDay.push(session);
      return;
    }
    if(session.nextOccurrence < endOfTomorrowTimeString) {
      MEETINGS_BY_TIME.future.tomorrow.push(session);
      return;
    }
    if(session.nextOccurrence < thisWeekTimeString) {
      MEETINGS_BY_TIME.future.thisWeek.push(session);
      return;
    }
    MEETINGS_BY_TIME.future.other.push(session);
  })

  console.log(MEETINGS_BY_TIME);
  return MEETINGS_BY_TIME;
}


function isInNextHour(timeString) {
  const nextHourTimeString = new Date(new Date().getTime() + MILLISECONDS_IN_HOUR);
  return timeString < nextHourTimeString;
}


window.categorizeSessions = categorizeSessions;
window.isInNextHour = isInNextHour;