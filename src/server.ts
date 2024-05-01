import express, {Express, Request, Response} from 'express';

let app: Express = express();
let PORT: number = 8080;

app.get('/', (request: Request, response: Response) => {
    response.status(200).json({message: "all good"});
});

app.listen(PORT, () => {
    console.log('app is running');
    
})
