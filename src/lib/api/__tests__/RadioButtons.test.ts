import RadioButtons from '../RadioButtons';

describe('RadioButtons', () => {
  test('#generate produces an empty but valid slack radio button message object', () => {
    const radioButtons = new RadioButtons('id');
    expect(radioButtons.generate()).toEqual({
      block_id: 'id',
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '',
        verbatim: false,
      },
    });
  });

  test('#setText can be used to set some text for the slack radio button message section', () => {
    const radioButtons = new RadioButtons('id');
    radioButtons.setText('totally testable');
    expect(radioButtons.generate()).toEqual({
      block_id: 'id',
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: 'totally testable',
        verbatim: false,
      },
    });
  });
});

