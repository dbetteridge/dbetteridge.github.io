---
templateKey: blog-post
title: Actix-Web with sessions
date: 2021-02-17T15:04:10.000Z
featuredpost: false
description: A simple sessions implementation with actix-web
tags:
  - Rust
  - Actix
  - Getting started
---

My goal in this post is to show some basic user registration (User actix handlers and calls to postgres) and session management using session tokens and actix_session to store them on the client.

---

### Disclaimer

I am learning Rust and do not pretend that this is the best solution or even particularly good Rust code.

---

### Folder structure

![Basic folder setup](FolderStructure.PNG)

---

### Database schema

[SQL Schema](https://github.com/dbetteridge/actix-session-example/blob/master/sql/schema.sql)

---

### Registering a new user

First we define a user model and map it to our users table.

```rust
  #[derive(Deserialize, PostgresMapper, Serialize, Debug)]
  #[pg_mapper(table = "users")] // singular 'user' is a keyword..
  pub struct User {
      pub email: String,
      pub name: String,
      pub username: String,
      pub password: String,
  }
```
[User model](https://github.com/dbetteridge/actix-session-example/blob/master/src/models.rs#L5)

---

Next we define a handler which is responsible for taking the HTTP request and returning some kind of response.  
We hash the password provided, writing this back into the User object in place of the plaintext password.  
This user is stored into the database and the result returned as JSON to the API caller.

```rust
  pub async fn add_user(
      user: web::Json<User>,
      db_pool: web::Data<Pool>,
  ) -> Result<HttpResponse, Error> {
      let mut user_info: User = user.into_inner();
      let hashed = hash(&user_info.password, DEFAULT_COST).unwrap();
      user_info.password = hashed;
      let client: Client = db_pool.get().await.map_err(MyError::PoolError)?;
      let new_user = db::add_user(&client, user_info).await?;
      Ok(HttpResponse::Ok().json(new_user))
  }
```
[add_user in handlers.rs](https://github.com/dbetteridge/actix-session-example/blob/master/src/handlers.rs#L13)

---

This is the way to link a particular route and HTTP method to a handler function.

```rust
  .service(web::resource("/register").route(web::post().to(add_user)))
```

The full code can be found in
[main.rs](https://github.com/dbetteridge/actix-session-example/blob/master/src/main.rs#L32)

---

The actual code run in `db::add_user` is shown below.  
the `iter().map().collect().pop()` step converts the returned rows from a postgres datastructure to a valid User model row by row
then collect them up into a Rust Vector and return the top result with pop.  
We could alternatively use `.query_one` in place of `.query` and convert that directly to a single User or an error message.

```rust
pub async fn add_user(client: &Client, user_info: User) -> Result<User, MyError> {
    let _stmt = include_str!("../sql/add_user.sql");
    let _stmt = _stmt.replace("$table_fields", &User::sql_table_fields());
    let stmt = client.prepare(&_stmt).await.unwrap();

    client
        .query(
            &stmt,
            &[
                &user_info.email,
                &user_info.name,
                &user_info.username,
                &user_info.password,
            ],
        )
        .await?
        .iter()
        .map(|row| User::from_row_ref(row).unwrap())
        .collect::<Vec<User>>()
        .pop()
        .ok_or(MyError::NotFound)
}
```

[The full file of database functions](https://github.com/dbetteridge/actix-session-example/blob/master/src/db.rs#L15)

---

### Session Handler and database function

The core of the session handling can be found in main.rs and handlers.rs login function

---

We use an actix-session to create a cookie, This cookie also allows us to set values much like using localStorage in the browser.

```rust
  .wrap(CookieSession::signed(&[0; 32]).secure(false))
```

[main.rs section on CookieSession](https://github.com/dbetteridge/actix-session-example/blob/master/src/main.rs#L24)

---

Here we are taking the session token returned from the database login call and setting it in our session cookie for later use.

```rust
  let db_session = db::login(&client, user_info).await?;
  session.set("session", db_session.token)?;
```

[The full login handler](https://github.com/dbetteridge/actix-session-example/blob/master/src/handlers.rs#L30)

---

We extract the session token from the session cookie and pass it to our database auth function.

```rust
  let session_token = session.get("session").unwrap().unwrap_or_default();
  db::auth(&client, session_token).await
```

[The auth handler](https://github.com/dbetteridge/actix-session-example/blob/master/src/handlers.rs#L116)

---

The database call to perform auth essentially checks that the given token exists in the database,
if it does then it checks that less then an hour has passed since it was created.  
If more then an hour has passed or if the session token isn't in the database we return an AuthError.

```rust
  match client
      .query(&stmt, &[&session_token])
      .await?
      .first()
      .map(|row| {
          (
              User::from_row_ref(row).unwrap(),
              Session::from_row_ref(row).unwrap(),
          )
      })
      .ok_or(MyError::AuthError(String::from("No valid session")))
  {
      Ok(r) => {
          let created: DateTime<Utc> = r.1.created;
          let now = Utc::now();
          let hour = chrono::Duration::milliseconds(60 * 60 * 1000);
          let has_not_expired = now.le(&created.add(hour));
          if has_not_expired {
              Ok(r.0)
          } else {
              Err(MyError::AuthError(String::from("No valid session")))
          }
      }
      Err(err) => Err(err),
  }
```

[The database function that checks sessions](https://github.com/dbetteridge/actix-session-example/blob/master/src/db.rs#L159)

---

We run the auth check and use the returned user object when auth is successful or throw an error if it fails.

```rust
  match auth(session, db_pool.clone()).await {
          Ok(user) => {
            let client: Client = db_pool.get().await.map_err(MyError::PoolError)?;
                let db_trades = db::trades(&client, &user).await?;
                Ok(HttpResponse::Ok().json(db_trades))
          }
          Err(err) => Err(err),
  }
```

[The auth handler in use](https://github.com/dbetteridge/actix-session-example/blob/master/src/handlers.rs#L63)

---

### Summary

And thats it, a simple user registration and session auth using actix.  
My next goal is re-write this using the actix actor model, so if that interests you keep an eye out for part 2.

---

### Links

[Full Github Repo](https://github.com/dbetteridge/actix-session-example)
