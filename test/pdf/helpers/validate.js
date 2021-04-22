module.exports = {
  overlayObject: {
    'addendum': {
      'margins': {
        'top': 0,
        'left': 0,
        'right': 0,
        'bottom': 0
      },
      'pageSize': {
        'width': 612,
        'height': 792
      },
      'labelStyle': {
        'fontSize': 10,
        'fontName': 'Lato',
        'textAlign': 'left',
        'textColor': '000000'
      }
    },
    'patches': [
      {
        'type': 'multiline-text',
        'content': 'Her, spread out over multiple lines. Hopefully we get to see the error.',
        'overflow': {
          'style': 'clip-overflow',
          'addendumLabel': 'real string'
        },
        'addendumText': {
          'fontSize': 12,
          'fontName': 'Lato',
          'textAlign': 'left',
          'textColor': '000000'
        },
        'lines': [
          {
            'page': 0,
            'area': {
              'top': 619.2,
              'left': 87.2,
              'width': 234.4,
              'height': 14.4
            },
            'text': {
              'fontSize': 12,
              'fontName': 'Lato',
              'textAlign': 'left',
              'textColor': '000000'
            }
          },
          {
            'page': 0,
            'area': {
              'top': 635.2,
              'left': 71.2,
              'width': 344,
              'height': 13.600000000000001
            },
            'text': {
              'fontSize': 12,
              'fontName': 'Lato',
              'textAlign': 'left',
              'textColor': '000000'
            }
          }
        ]
      }
    ]
  }
}
