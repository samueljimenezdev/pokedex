import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { isValidObjectId, Model } from 'mongoose';
import { Pokemon } from './entities/pokemon.entity';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class PokemonService {

  constructor(
    @InjectModel(Pokemon.name)
    private readonly pokemonModel : Model<Pokemon>
  ){}

  async create(createPokemonDto: CreatePokemonDto) {

    createPokemonDto.name = createPokemonDto.name.toLowerCase();
      
    try{
      return await this.pokemonModel.create(createPokemonDto); 
    }catch(error){
      this.handleException(error);
    }

  }

  async findAll() {
    return await this.pokemonModel.find()
  }

  async findOne(term: string): Promise<Pokemon> {


    if(!isNaN(+term)){
      return await this.pokemonModel.findOne({no: term})
    }

    if(isValidObjectId(term)){
      return await this.pokemonModel.findById(term)
    }

    const pokemon: Pokemon = await this.pokemonModel.findOne({name : term.toLowerCase()})


    if(!pokemon) throw new NotFoundException(`The pokemon with id, name or no ${term} not found.`)

    return pokemon;
  }

  async update(term: string, updatePokemonDto: UpdatePokemonDto) {
    const pokemon = await this.findOne(term);
    if(updatePokemonDto.name){
      updatePokemonDto.name = updatePokemonDto.name.toLowerCase()
    }
    try{
      await pokemon.updateOne(updatePokemonDto, {new : true})
      return {...pokemon.toJSON(), ...updatePokemonDto};
    }catch(error){
      this.handleException(error);
    }
  }

  async remove(id: string) {

    const result = await this.pokemonModel.deleteOne({_id: id})
    if (result.deletedCount == 0){
      throw new NotFoundException(`The pokemon with id ${id} not found to delete`)
    }
  }

  private handleException(error: any){
    if(error.code === 11000){
      throw new BadRequestException(`Pokemon exists in db ${JSON.stringify(error.keyValue)}`);
    }
    console.log(error);
    throw new InternalServerErrorException(`Can't update pokemon - Check servers log`)
  }
}
