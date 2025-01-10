export const styles = `
  @keyframes scaleUp {
    0% { transform: scale(1); }
    100% { transform: scale(1.05); }
  }

  @keyframes scaleDown {
    0% { transform: scale(1.05); }
    100% { transform: scale(1); }
  }

  .message-animate {
    animation: scaleDown 0.5s ease-in-out forwards;
  }

  .message-animate.hovered {
    animation: scaleUp 0.5s ease-in-out forwards;
  }

  body {
    background-color: #0a0a0a;
    color: #d0d0d0;
  }
`; 