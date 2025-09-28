module tickets_package::user{
    //use tickets_package::tickets_package::tickets;
    use std::string::String;

    /// Define the Client struct
    public struct Client has key, store {
        id: UID,
        username: String,
        is_active: bool,
        //history: vector<Nft> // History of purchased tickets
    } 

    public struct Organizer has key, store {
        id: UID,
        username: String,
        url: String,
        events: vector<address>, 
        is_active: bool ,// List of events created by the organizer
    }

        /// Create a new client
    public fun create_client(username: String, url: String, ctx: &mut TxContext)
    {
        let client = Client {
            username: username,
            id: object::new(ctx),
            is_active: true,
            //history: vector::empty<Nft>(),
       };
       transfer::public_transfer(client, ctx.sender())
       //transfer::share_object(client);
    }

    /// Create a new organizer
    public fun create_organizer( url: String, username: String, ctx: &mut TxContext )
    {
        let organizer = Organizer {
            id: object::new(ctx),
            url: url,
            events: vector::empty<address>(),
            username: username,
            is_active: true,
        };
        transfer::public_transfer(organizer, ctx.sender());
    }


    /// update the username of a client
    public fun update_client(client: &mut Client, username: String) {
        client.username = username;
    }
    
    /// update the username of an organizer
    public fun update_organizer(organizer: &mut Organizer, username: String) {
        organizer.username = username;
    }   

    public fun get_client_username(client: &Client): &String {
        &client.username
    }

    public fun get_organizer_username(organizer: &Organizer): &String {
        &organizer.username
    }

    public fun get_client_status(client: &Client): bool {
        client.is_active
    }
   
    public fun get_organizer_status(client: &Organizer): bool {
        client.is_active
    }

    /* Désactiver le
     client
    public fun deactivate_client(client: &mut Client) {
       client.is_active = false;

}

    public fun activate_client(client: &mut Client) {
        client.is_active = true;
    }

    public fun get_organizer_events(organizer: &Organizer): &vector<address> {
        &organizer.events
    }

    public fun get_client_id(client: &Client): &UID {
        &client.id
    }

    public fun get_organizer_id(organizer: &Organizer): &UID {
        &organizer.id
    }
     */

    
    // Verify if the client is active

//   Add an event to the organizer's list of events
    public fun add_event(organizer: &mut Organizer, event: address) {
        vector::push_back(&mut organizer.events, event);
    }

} 