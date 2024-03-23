use std::sync::Arc;

use discord_sdk as ds;
use tokio::sync::Mutex;

pub const APP_ID: ds::AppId = 1203039006846361762;

pub struct Client {
    pub discord: Arc<Mutex<ds::Discord>>,
}

pub async fn make_client(subs: ds::Subscriptions) -> Client {
    let (wheel, handler) = ds::wheel::Wheel::new(Box::new(|_| {}));
    let mut user = wheel.user();

    let discord = ds::Discord::new(ds::DiscordApp::PlainId(APP_ID), subs, Box::new(handler))
        .expect("unable to create discord client");

    let client = Client {
        discord: Arc::new(Mutex::new(discord)),
    };

    tokio::spawn(async move {
        loop {
            let result = user.0.changed().await;

            if result.is_err() {
                break;
            }
        }
    });

    return client;
}
