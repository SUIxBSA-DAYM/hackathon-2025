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
    use sui::clock::{Clock, timestamp_ms};
    use sui::sui::SUI ;
    use tickets_package::user::Organizer;

    // --- Errors ---
    /// Error thrown when the lengths of the places and capacities vectors do not match.
    const EPlaceNameCapacityLengthMismatch: u64 = 400;
    const ETicketsSoldOut: u64 = 401;
    const EEventInPast: u64 = 402;
    const EEventMismatch: u64 = 403;
    const ENFTAlreadyUsed: u64 = 404;

    public struct Event has key, store {
        id: UID,
        name: String,
        location: String, // format (float, float)
        time: u64,
        organizer: address,
        category: String,
        inventory: Inventory
    }

    public struct Inventory has key, store {
        id: UID,
        owner: address,                  // organizers of the event are the owners of the inventory
        total_capacity: u64,
        places: Table<Place, vector<Nft>>  // map place IDs to NFT vectors
    }

    public struct Place has store, copy, drop {
        price_sui: u64,
        capacity: u64,
        name: String
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

    public fun create_place(name: String, price_sui: u64, capacity: u64): Place {
        Place {
            name,
            price_sui,
            capacity
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
            let place = create_place(
                *vector::borrow(&places, idx),
                *vector::borrow(&prices, idx),
                *vector::borrow(&capacities, idx),

            );
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
        organizer.add_event(object::uid_to_address(&event.id));
        event
    }

    public fun buy_ticket(payment_coin: &mut Coin<SUI>, user: address, event: &mut Event, place: Place, clock: &Clock, ctx: &mut TxContext) {
        let mut tickets = table::borrow_mut(&mut event.inventory.places, place);
        assert!(vector::length(tickets) > 0, ETicketsSoldOut);
        let pay_coin = coin::split(payment_coin, place.price_sui, ctx);
        let nft = tickets.pop_back();
        let Nft {id, event, creation_date, owner, organizer, used, name} = nft;
        id.delete();
        let current_time = timestamp_ms(clock);
        assert!(creation_date < current_time, EEventInPast);
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

    }

    public fun validate_ticket(nft: &mut UserNft, event: address) {
        assert!(nft.organizer == organizer, EEventMismatch);
        assert!(!nft.used, ENFTAlreadyUsed);
        nft.used = true;
    }

}







