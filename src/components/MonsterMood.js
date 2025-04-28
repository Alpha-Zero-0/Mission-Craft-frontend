import React from "react";
import happyMonster from "../monsters/happy.png";
import tiredMonster from "../monsters/tired.png";
import sadMonster from "../monsters/sad.png";
import superMonster from "../monsters/super.png";

const MonsterMood = ({ completionRate, productiveTime, screenTime }) => {
  let mood = "happy";
  let image = happyMonster;

  if (completionRate >= 80 && productiveTime > screenTime) {
    mood = "super";
    image = superMonster;
  } else if (completionRate < 50) {
    mood = "sad";
    image = sadMonster;
  } else if (screenTime > productiveTime) {
    mood = "tired";
    image = tiredMonster;
  }

  return (
    <div style={{ textAlign: "center", marginTop: "2rem" }}>
      <img
        src={image}
        alt={mood}
        style={{
          width: "200px",
          animation: "bounceBreath 3s infinite ease-in-out",
          transformOrigin: "center bottom"
        }}
      />
      <h4>Monster Mood: {mood.charAt(0).toUpperCase() + mood.slice(1)}</h4>
    </div>
  );
};

export default MonsterMood;
