jsonjs.data['user_tag'] = [
  {
    id: 1,
    user_id: 1,
    tag_id: 1,
    note: '<script>alert("xss")</script>',
  },
  {
    id: 2,
    user_id: 1,
    tag_id: 2,
    note: 'Safe <b>content</b>',
  },
  {
    id: 3,
    user_id: 2,
    tag_id: 2,
    note: 'Normal text',
  },
]
