/*
/// Module: tickets_package
module tickets_package::tickets_package;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions


module tickets_package::tickets_package {
    use std::string::{Self, String};
    use sui::table::{Self, Table};
    use sui::coin::{Self, Coin};
    use sui::event;
    use sui::clock::{Clock, timestamp_ms, Self};
    use sui::sui::SUI ;


    // --- Errors ---
    /// Error thrown when the lengths of the places and capacities vectors do not match.
    const EPlaceNameCapacityLengthMismatch: u64 = 400;
    const ENotEnoughTicketsForindividual : u64 = 401 ;
    const EBuyRequestBeforeTime : u64 = 402 ;
    const ENot_enough_tickets_for_bacth : u64 = 403 ;

    public struct Event has key, store {
        id: UID,
        name: String,
        location: String,
        // format (float, float)
        time: u64,
        organizer: address,
        category: String,
        inventory: Inventory
    }

    public struct Inventory has key, store {
        id: UID,
        owner: address,
        // organizers of the event are the owners of the inventory
        total_capacity: u64,
        places: Table<Place, vector<Nft>>  // map place IDs to NFT vectors
    }

    public struct Place has store, copy, drop {
        price_sui: u64,
        capacity: u64,
        name: String
    }

    public struct Organizer has key {
        id: UID,
        url: String,
        events: vector<address>
    }

    public struct Nft has key, store {
        id: UID,
        event: address,
        creation_date: u64,
        owner: address,
        organizer: address,
        used: bool,
        name: String
    }

    public struct UserNft has key {
        id: UID,
        event: address,
        buy_date: u64,
        owner: address,
        organizer: address,
        used: bool,
        name: String
    }

    public struct NFTMinted has copy, drop {
        // The Object ID of the NFT
        object_id: ID,
        // The creator of the NFT
        creator: address,
        // The name of the NFT
        name: String,
    }

    public fun name(event: &Event): &String {
        &event.name
    }

    public fun total_capacity(event: &Event): u64 {
        event.inventory.total_capacity
    }

    public fun create_organizer(url: String, ctx: &mut TxContext): Organizer {
        Organizer {
            id: object::new(ctx),
            url,
            events: vector::empty<address>()
        }
    }

    /// Create a new nft ticket, only the organization owner should call this function
    /// TODO: add checks to ensure only the organizer can create an NFT for their event
    public fun create_nft(name: String, event: address, creation_date: u64, owner: address, ctx: &mut TxContext): Nft {
        Nft {
            id: object::new(ctx),
            event: event,
            creation_date: creation_date,
            owner: owner,
            organizer: owner,
            used: false,
            name: name
        }
    }

    /// Create a new event, only the organization owner should call this function
    public fun create_event(
        name: String,
        location: String,
        time: u64,
        category: String,
        places: vector<String>,
        prices: vector<u64>,
        capacities: vector<u64>,
        organizer: &mut Organizer,
        ctx: &mut TxContext
    ): Event {
        assert!(vector::length(&places) == vector::length(&capacities), EPlaceNameCapacityLengthMismatch);
        assert!(vector::length(&prices) == vector::length(&places), EPlaceNameCapacityLengthMismatch);
        let owner = ctx.sender();
        let mut inventory = Inventory {
        id: object::new(ctx),
        owner,
        total_capacity: 0,
        places: table::new<Place, vector<Nft>>(ctx)
        };
        let event_id = object::new(ctx);
        let mut idx = 0;
        while (idx < vector::length(&places)) {
        let place = Place {
        capacity: *vector::borrow(&capacities, idx),
        name: *vector::borrow(&places, idx),
        price_sui: *vector::borrow(&prices, idx)
        };
        table::add(&mut inventory.places, place, vector::empty<Nft>());
        let mut idx2 = 0;
        while (idx2 < place.capacity) {
        let nft = create_nft(place.name, object::uid_to_address(&event_id), time, owner, ctx);
        let nft_vector = table::borrow_mut(&mut inventory.places, place);
        vector::push_back(nft_vector, nft);
        idx2 = idx2 + 1;
        };
        inventory.total_capacity = inventory.total_capacity + place.capacity;
        idx = idx + 1;
        };
        let event = Event {
        id: event_id,
        name,
        location,
        time,
        organizer: owner,
        category,
        inventory
        };
        vector::push_back(&mut organizer.events, object::uid_to_address(&event.id));
        event
    }

    public entry fun buy_ticket(
        payment_coin: &mut Coin<SUI>,
        user: address,
        event: &mut Event,
        place_name: String,
        place_number: u64,
        place_price: u64,
        clock: &Clock,
        batch_pay : bool,
        ctx: &mut TxContext
    ){
        let place = Place {
            name: place_name,
            price_sui: place_price,
            capacity: place_number
        };
        let mut tickets = table::borrow_mut(&mut event.inventory.places, place);
        assert!(vector::length(tickets) > 0, 401);
        if(!batch_pay){
            let pay_coin = coin::split(payment_coin, place.price_sui, ctx);
            let nft = tickets.pop_back();
            let Nft {id, event, creation_date, owner, organizer, used, name} = nft;
            id.delete();
            let current_time = clock::timestamp_ms(clock);
            assert!(creation_date < current_time, 402);
            let user_ntf = UserNft {
            id: object::new(ctx),
            event,
            buy_date: current_time,
            owner: user,
            organizer,
            used: false,
            name
            };

            event::emit(NFTMinted {
            object_id: object::id(&user_ntf),
            creator: organizer,
            name: user_ntf.name
            });

            transfer::public_transfer(pay_coin, organizer);
            transfer::transfer(user_ntf, user);
        } else {
            let nft = tickets.pop_back();
            let Nft {id, event, creation_date, owner, organizer, used, name} = nft;
            id.delete();
            let current_time = clock::timestamp_ms(clock);
            assert!(creation_date < current_time, 402);
            let user_ntf = UserNft {
            id: object::new(ctx),
            event,
            buy_date: current_time,
            owner: user,
            organizer,
            used: false,
            name
            };

            event::emit(NFTMinted {
            object_id: object::id(&user_ntf),
            creator: organizer,
            name: user_ntf.name
            });
            transfer::transfer(user_ntf, user)
        }

    }
    public fun buy_batch(
        payment_coin: &mut Coin<SUI>,
        organizer : address,
        main_buyer : address,
        all_buyers: vector<address>,
        event: &mut Event,
        place: Place,
        clock: &Clock,
        size_batch : u64 ,
        discount : u64,
        ctx: &mut TxContext
    ){
        let tickets = table::borrow_mut(&mut event.inventory.places, place);
        assert!(vector::length(tickets) >= size_batch, 403);
        let total_price  = size_batch*(place.price_sui*100 - place.price_sui*discount)/100 ;
        let pay_coin = coin::split(payment_coin, total_price , ctx);
        transfer::public_transfer(pay_coin, organizer);
        let Place { name, price_sui, capacity} = place;
        let mut i = 0;
        while(i < size_batch){
            let user = *vector::borrow(&all_buyers, i );
            buy_ticket(
                    payment_coin,
                    user,
                    event,
                    name,
                    capacity,
                    price_sui,
                    clock,
                    true,
                    ctx
            );
            i = i + 1 ;
        }

    }




}







