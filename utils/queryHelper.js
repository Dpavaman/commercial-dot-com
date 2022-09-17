class QueryHelper {
    constructor(model, query){
        this.model = model,
        this.query = query
    }


    search(){
        const searchTerm = this.query.search ? {
            name : {
                $regex : this.query.search,
                $options : 'i'
            }
        } : {}

        this.model = this.model.find({...searchTerm});
        return this
    }

    pager(resultPerPage){
        /**
         * this method helps us to get exact number and index 
         * of elements to be shown on screen. 
         */
        let currentPage = this.query.page || 1;
        const skipCount = resultPerPage * (currentPage - 1);
        this.model = this.model.limit(resultPerPage).skip(skipCount);
        return this
    }
    
    filter(){
        const queryCopy = Object.assign({}, this.query);

        /**
         * Removing below properties 
         * since they have a dedicated methods to handle them
         */

        delete queryCopy['search'];
        delete queryCopy['limit'];
        delete queryCopy['page'];

        let queryString = JSON.stringify(queryCopy);
        queryString = queryString.replace(/\b gte|lte|lt|gt|eq|in|nin \b/g, (match) => `$${match}`);

        const queryObject = JSON.parse(queryString)

        this.model = this.model.find(queryObject)
        return this
    }

}

module.exports = QueryHelper
