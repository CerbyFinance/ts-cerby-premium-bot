interface userMessage {
    message_id: number,
    from: {
        id: number,
        is_bot: false,
        first_name: string,
        last_name?: string,
        language_code: string
    },
    chat: {
        id: number,
        first_name: string,
        last_name?: string,
        type: string
    },
    date: Date,
    text: string,
    entities: any[],
    reply_to_message?: {
        message_id: number,
        from: {
          id: number,
          is_bot: boolean,
          first_name: string,
          last_name?: string 
        },
        chat: {
          id: number,
          title: string,
          username?: string,
          type: string
        },
        date: Date,
        text?: string,
        photo?: [{
            file_id: string,
            file_unique_id: string
            file_size: number
            width: number,
            height: number
          }]
        caption?: string
        entities: [ [Object] ]
      },
}